import OpenRouterInterface from "@/components/openrouter-interface"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-6">OpenRouter AI Interface</h1>
        <OpenRouterInterface />
      </div>
    </main>
  )
}

