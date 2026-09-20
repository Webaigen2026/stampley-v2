import {
  applyFixedWindowFailure,
  type LoginThrottleRow,
  type LoginThrottleStore,
} from "./auth-throttle";

class SerialLock {
  private tail: Promise<void> = Promise.resolve();

  run<T>(fn: () => Promise<T> | T): Promise<T> {
    const next = this.tail.then(() => fn());
    this.tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

/** In-memory store for AUTH-2 tests. Serializes per key like a row lock. */
export class MemoryLoginThrottleStore implements LoginThrottleStore {
  readonly pair = new Map<string, LoginThrottleRow>();
  readonly ip = new Map<string, LoginThrottleRow>();
  private readonly pairLocks = new Map<string, SerialLock>();
  private readonly ipLocks = new Map<string, SerialLock>();

  pairKey(userId: string, ipHash: string) {
    return `${userId}\0${ipHash}`;
  }

  private lockFor(locks: Map<string, SerialLock>, key: string) {
    let lock = locks.get(key);
    if (!lock) {
      lock = new SerialLock();
      locks.set(key, lock);
    }
    return lock;
  }

  async getIpThrottle(ipHash: string) {
    return this.ip.get(ipHash) ?? null;
  }

  async getPairThrottle(userId: string, ipHash: string) {
    return this.pair.get(this.pairKey(userId, ipHash)) ?? null;
  }

  async recordIpFailure(ipHash: string, now: Date) {
    await this.lockFor(this.ipLocks, ipHash).run(() => {
      this.ip.set(
        ipHash,
        applyFixedWindowFailure(this.ip.get(ipHash) ?? null, now),
      );
    });
  }

  async recordPairFailure(userId: string, ipHash: string, now: Date) {
    const key = this.pairKey(userId, ipHash);
    await this.lockFor(this.pairLocks, key).run(() => {
      this.pair.set(
        key,
        applyFixedWindowFailure(this.pair.get(key) ?? null, now),
      );
    });
  }

  async clearUserPairThrottles(userId: string) {
    for (const key of [...this.pair.keys()]) {
      if (key.startsWith(`${userId}\0`)) this.pair.delete(key);
    }
  }
}
