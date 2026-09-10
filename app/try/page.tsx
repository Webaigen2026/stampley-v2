import GettingStartedView from "@/components/getting-started/GettingStartedView"




export  default function TryPage() {
  return (
    <main className="w min-h-screen flex flex-col justify-center items-center">
      <div className="mx-auto max-w-full px-5 py-12 sm:px-8 sm:py-16 lg:px-5 lg:py-20">
        <GettingStartedView />
      </div>
    </main>
  )
}