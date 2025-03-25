export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">OpenRouter AI Interface</h1>
      <iframe
        src="/static/index.html"
        className="w-full h-[800px] border border-gray-300 rounded-lg"
        title="OpenRouter Interface"
      />
    </main>
  )
}

