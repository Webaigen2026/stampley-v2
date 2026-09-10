import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/* ============================================================
   EMAIL DESIGN TOKENS
============================================================ */

const EMAIL_COLORS = {
  canvas: "#F5F8FC",
  white: "#FFFFFF",

  navy: "#173B7A",
  navyDark: "#0B2857",

  blue: "#1473E6",
  cyan: "#0E7490",

  gold: "#F2B134",

  text: "#334155",
  muted: "#64748B",
  subtle: "#94A3B8",

  line: "#E4EBF3",

  blueSoft: "#EEF6FF",
  goldSoft: "#FFF8E8",
  slateSoft: "#F7F9FC",

  dangerSoft: "#FFF5F5",
} as const

const EMAIL_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const MONO_FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

/* ============================================================
   SHARED HELPERS
============================================================ */

function getAppBaseUrl() {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.AUTH_URL?.trim()

  if (!raw) return null

  return raw.replace(/\/$/, "")
}

function emailShell({
  eyebrow,
  title,
  description,
  content,
  preheader,
}: {
  eyebrow: string
  title: string
  description?: string
  content: string
  preheader?: string
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="color-scheme" content="light" />
        <meta
          name="supported-color-schemes"
          content="light"
        />
        <title>${title}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: ${EMAIL_COLORS.canvas};
          font-family: ${EMAIL_FONT};
          color: ${EMAIL_COLORS.text};
          -webkit-font-smoothing: antialiased;
        "
      >
        ${
          preheader
            ? `
          <div
            style="
              display: none;
              max-height: 0;
              overflow: hidden;
              opacity: 0;
              color: transparent;
              visibility: hidden;
              mso-hide: all;
            "
          >
            ${preheader}
          </div>
        `
            : ""
        }

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width: 100%;
            background-color: ${EMAIL_COLORS.canvas};
            border-collapse: collapse;
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding: 36px 18px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width: 100%;
                  max-width: 600px;
                  border-collapse: separate;
                  border-spacing: 0;
                  overflow: hidden;
                  background-color: ${EMAIL_COLORS.white};
                  border-radius: 18px;
                  box-shadow: 0 18px 50px rgba(15, 45, 80, 0.08);
                "
              >
                <!-- Brand accent -->
                <tr>
                  <td
                    style="
                      padding: 0;
                      height: 5px;
                      background: linear-gradient(
                        90deg,
                        ${EMAIL_COLORS.blue} 0%,
                        ${EMAIL_COLORS.blue} 66%,
                        ${EMAIL_COLORS.gold} 66%,
                        ${EMAIL_COLORS.gold} 100%
                      );
                    "
                  ></td>
                </tr>

                <!-- Header -->
                <tr>
                  <td
                    style="
                      padding: 32px 40px 20px 40px;
                    "
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="border-collapse: collapse;"
                    >
                      <tr>
                        <td valign="middle">
                          <div
                            style="
                              font-size: 20px;
                              line-height: 1.1;
                              font-weight: 600;
                              letter-spacing: -0.02em;
                              color: ${EMAIL_COLORS.navyDark};
                            "
                          >
                            AIDES-T2D
                          </div>

                          <div
                            style="
                              margin-top: 5px;
                              font-size: 12px;
                              line-height: 1.5;
                              color: ${EMAIL_COLORS.muted};
                            "
                          >
                            AI-Driven Emotional Support for Type 2 Diabetes
                          </div>
                        </td>

                        <td
                          align="right"
                          valign="middle"
                        >
                          <div
                            style="
                              display: inline-block;
                              padding: 6px 10px;
                              border-radius: 999px;
                              background-color: ${EMAIL_COLORS.blueSoft};
                              font-size: 10px;
                              line-height: 1;
                              font-weight: 600;
                              letter-spacing: 0.12em;
                              text-transform: uppercase;
                              color: ${EMAIL_COLORS.navy};
                            "
                          >
                            Study Portal
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main content -->
                <tr>
                  <td
                    style="
                      padding: 16px 40px 40px 40px;
                    "
                  >
                    <div
                      style="
                        margin-bottom: 14px;
                        font-size: 11px;
                        line-height: 1.4;
                        font-weight: 700;
                        letter-spacing: 0.2em;
                        text-transform: uppercase;
                        color: ${EMAIL_COLORS.cyan};
                      "
                    >
                      ${eyebrow}
                    </div>

                    <h1
                      style="
                        margin: 0;
                        max-width: 480px;
                        font-size: 34px;
                        line-height: 1.12;
                        font-weight: 400;
                        letter-spacing: -0.035em;
                        color: ${EMAIL_COLORS.navyDark};
                      "
                    >
                      ${title}
                    </h1>

                    ${
                      description
                        ? `
                      <p
                        style="
                          margin: 18px 0 0 0;
                          max-width: 500px;
                          font-size: 16px;
                          line-height: 1.7;
                          font-weight: 400;
                          color: ${EMAIL_COLORS.muted};
                        "
                      >
                        ${description}
                      </p>
                    `
                        : ""
                    }

                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    style="
                      padding: 26px 40px 30px 40px;
                      border-top: 1px solid ${EMAIL_COLORS.line};
                      background-color: #FBFCFE;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        line-height: 1.7;
                        color: ${EMAIL_COLORS.muted};
                      "
                    >
                      AIDES-T2D Research Study
                    </p>

                    <p
                      style="
                        margin: 2px 0 0 0;
                        font-size: 12px;
                        line-height: 1.7;
                        color: ${EMAIL_COLORS.subtle};
                      "
                    >
                      University of Massachusetts Boston
                    </p>

                    <p
                      style="
                        margin: 10px 0 0 0;
                        font-size: 11px;
                        line-height: 1.6;
                        color: ${EMAIL_COLORS.subtle};
                      "
                    >
                      pcrg@umb.edu
                      &nbsp;&nbsp;•&nbsp;&nbsp;
                      617-287-4067
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Outside footer -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width: 100%;
                  max-width: 600px;
                  border-collapse: collapse;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding: 18px 20px 0 20px;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 10px;
                        line-height: 1.6;
                        color: ${EMAIL_COLORS.subtle};
                      "
                    >
                      This message was sent as part of the AIDES-T2D
                      research study.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

/* ============================================================
   SHARED EMAIL COMPONENTS
============================================================ */

function primaryButton({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return `
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        margin: 28px 0 28px 0;
        border-collapse: collapse;
      "
    >
      <tr>
        <td
          bgcolor="${EMAIL_COLORS.navy}"
          style="
            border-radius: 10px;
          "
        >
          <a
            href="${href}"
            style="
              display: inline-block;
              padding: 15px 22px;
              font-family: ${EMAIL_FONT};
              font-size: 14px;
              line-height: 1;
              font-weight: 500;
              color: #FFFFFF;
              text-decoration: none;
              border-radius: 10px;
            "
          >
            ${label}
            <span
              style="
                display: inline-block;
                margin-left: 14px;
              "
            >
              &rarr;
            </span>
          </a>
        </td>
      </tr>
    </table>
  `
}

function securityNotice(text: string) {
  return `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        margin: 26px 0 0 0;
        border-collapse: separate;
        border-spacing: 0;
      "
    >
      <tr>
        <td
          style="
            padding: 15px 16px;
            border-radius: 10px;
            background-color: ${EMAIL_COLORS.slateSoft};
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="border-collapse: collapse;"
          >
            <tr>
              <td
                valign="top"
                style="
                  width: 24px;
                  padding-top: 1px;
                  font-size: 14px;
                  color: ${EMAIL_COLORS.navy};
                "
              >
                &#128274;
              </td>

              <td
                valign="top"
                style="
                  font-size: 12px;
                  line-height: 1.65;
                  color: ${EMAIL_COLORS.muted};
                "
              >
                ${text}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

function fallbackLink({
  href,
  label = "If the button does not work, copy and paste this link into your browser:",
}: {
  href: string
  label?: string
}) {
  return `
    <div
      style="
        margin-top: 26px;
        padding-top: 22px;
        border-top: 1px solid ${EMAIL_COLORS.line};
      "
    >
      <p
        style="
          margin: 0 0 8px 0;
          font-size: 11px;
          line-height: 1.6;
          color: ${EMAIL_COLORS.subtle};
        "
      >
        ${label}
      </p>

      <p
        style="
          margin: 0;
          font-size: 11px;
          line-height: 1.6;
          word-break: break-all;
          color: ${EMAIL_COLORS.muted};
        "
      >
        ${href}
      </p>
    </div>
  `
}

/* ============================================================
   PASSWORD RESET EMAIL
============================================================ */

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  const html = emailShell({
    eyebrow: "Account security",
    title: "Reset your password",
    description:
      "We received a request to reset the password for your AIDES-T2D account.",
    preheader:
      "Use this secure link to create a new password for your AIDES-T2D account.",
    content: `
      <p
        style="
          margin: 24px 0 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: ${EMAIL_COLORS.text};
        "
      >
        Select the button below to choose a new password.
        This reset link expires in <strong>1 hour</strong>.
      </p>

      ${primaryButton({
        href: resetUrl,
        label: "Reset password",
      })}

      ${securityNotice(
        "If you did not request a password reset, you can safely ignore this email. Your password will not change."
      )}

      ${fallbackLink({
        href: resetUrl,
      })}
    `,
  })

  const { error } = await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "AIDES-T2D <onboarding@resend.dev>",
    to: email,
    subject: "Reset your AIDES-T2D password",
    html,
  })

  if (error) {
    console.error(
      "[sendPasswordResetEmail] error:",
      error
    )

    throw new Error("Failed to send email")
  }

  return { success: true }
}

/* ============================================================
   STUDY ID EMAIL
============================================================ */

export async function sendStudyKeyEmail({
  email,
  studyKey,
}: {
  email: string
  studyKey: string
}) {
  const registerUrl = (() => {
    const appUrl = getAppBaseUrl()

    return appUrl
      ? `${appUrl}/register`
      : null
  })()

  const html = emailShell({
    eyebrow: "You're invited",
    title: "Your AIDES-T2D Study ID",
    description:
      "A member of the AIDES-T2D study team has created a Study ID for you.",
    preheader:
      "Your AIDES-T2D Study ID is ready. Use it when creating your participant account.",
    content: `
      <p
        style="
          margin: 24px 0 0 0;
          font-size: 14px;
          line-height: 1.7;
          color: ${EMAIL_COLORS.text};
        "
      >
        You will use this Study ID when registering for the study application.
      </p>

      <!-- Study ID -->
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
          width: 100%;
          margin: 28px 0 22px 0;
          border-collapse: separate;
          border-spacing: 0;
        "
      >
        <tr>
          <td
            align="center"
            style="
              padding: 24px 20px;
              border-radius: 12px;
              background-color: ${EMAIL_COLORS.blueSoft};
              border: 1px solid #D9E9FB;
            "
          >
            <div
              style="
                margin-bottom: 10px;
                font-size: 10px;
                line-height: 1.4;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: ${EMAIL_COLORS.blue};
              "
            >
              Your Study ID
            </div>

            <div
              style="
                font-family: ${MONO_FONT};
                font-size: 24px;
                line-height: 1.25;
                font-weight: 700;
                letter-spacing: 0.08em;
                color: ${EMAIL_COLORS.navyDark};
              "
            >
              ${studyKey}
            </div>
          </td>
        </tr>
      </table>

      <p
        style="
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: ${EMAIL_COLORS.muted};
        "
      >
        Please keep this Study ID private. Do not share it with anyone
        outside the study team.
      </p>

      ${
        registerUrl
          ? `
        ${primaryButton({
          href: registerUrl,
          label: "Create your account",
        })}

        ${fallbackLink({
          href: registerUrl,
          label:
            "If the registration button does not work, copy and paste this link into your browser:",
        })}
      `
          : `
        <div
          style="
            margin-top: 26px;
            padding: 16px;
            border-radius: 10px;
            background-color: ${EMAIL_COLORS.slateSoft};
          "
        >
          <p
            style="
              margin: 0;
              font-size: 13px;
              line-height: 1.7;
              color: ${EMAIL_COLORS.text};
            "
          >
            Open the AIDES-T2D registration page provided by the study team
            and enter this Study ID when prompted.
          </p>
        </div>
      `
      }

      ${securityNotice(
        "This message is an invitation to participate in the AIDES-T2D research study. It is not medical advice. If you were not expecting this email, you can ignore it."
      )}
    `,
  })

  const { error } = await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "AIDES-T2D <onboarding@resend.dev>",
    to: email,
    subject: "Your AIDES-T2D Study ID",
    html,
  })

  if (error) {
    console.error(
      "[sendStudyKeyEmail] error:",
      error
    )

    throw new Error("Failed to send email")
  }

  return { success: true }
}

/* ============================================================
   REGISTRATION VERIFICATION EMAIL
============================================================ */

export async function sendRegistrationVerificationEmail({
  email,
  code,
}: {
  email: string
  code: string
}) {
  const html = emailShell({
    eyebrow: "Verify your email",
    title: "Finish creating your account",
    description:
      "Use the verification code below to finish creating your AIDES-T2D participant account.",
    preheader:
      "Your AIDES-T2D email verification code is ready.",
    content: `
      <!-- Verification code -->
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
          width: 100%;
          margin: 28px 0 22px 0;
          border-collapse: separate;
          border-spacing: 0;
        "
      >
        <tr>
          <td
            align="center"
            style="
              padding: 26px 20px;
              border-radius: 12px;
              background-color: ${EMAIL_COLORS.blueSoft};
              border: 1px solid #D9E9FB;
            "
          >
            <div
              style="
                margin-bottom: 10px;
                font-size: 10px;
                line-height: 1.4;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: ${EMAIL_COLORS.blue};
              "
            >
              Verification code
            </div>

            <div
              style="
                font-family: ${MONO_FONT};
                font-size: 32px;
                line-height: 1.2;
                font-weight: 700;
                letter-spacing: 0.24em;
                color: ${EMAIL_COLORS.navyDark};
              "
            >
              ${code}
            </div>

            <div
              style="
                margin-top: 12px;
                font-size: 12px;
                line-height: 1.5;
                color: ${EMAIL_COLORS.muted};
              "
            >
              Expires in 10 minutes
            </div>
          </td>
        </tr>
      </table>

      ${securityNotice(
        "Do not share this verification code with anyone. If you did not request this, you can safely ignore this email."
      )}

      <p
        style="
          margin: 24px 0 0 0;
          font-size: 12px;
          line-height: 1.65;
          color: ${EMAIL_COLORS.subtle};
        "
      >
        Return to the AIDES-T2D verification page and enter the
        six-digit code shown above.
      </p>
    `,
  })

  const { error } = await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "AIDES-T2D <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email",
    html,
  })

  if (error) {
    console.error(
      "[sendRegistrationVerificationEmail] error:",
      error
    )

    throw new Error("Failed to send email")
  }

  return { success: true }
}