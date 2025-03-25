"use client"

import { useState } from "react"

export default function OpenRouterInterface() {
  // State variables
  const [language, setLanguage] = useState("中文")
  const [model, setModel] = useState("deepseek/deepseek-r1:free")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [splitMethod, setSplitMethod] = useState("chapter")
  const [splitLength, setSplitLength] = useState(1000)
  const [prompt, setPrompt] = useState("")
  const [additionalText, setAdditionalText] = useState("")
  const [processing, setProcessing] = useState(false)
  const [shouldStop, setShouldStop] = useState(false)
  const [currentResults, setCurrentResults] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [currentProgressText, setCurrentProgressText] = useState("")
  const [currentResultText, setCurrentResultText] = useState("")
  const [finalResultText, setFinalResultText] = useState("")

  // Split length label
  const getSplitLengthLabel = () => {
    if (language === "ENG") {
      return "Words per part:"
    } else if (language === "中文" || language === "Việt Nam") {
      return "Characters per part:"
    } else {
      return "Characters/words per part:"
    }
  }

  // Validate inputs
  const validateInputs = () => {
    const errors = []

    if (!apiKey.trim()) {
      errors.push("API Key is required")
    }

    if (!prompt.trim()) {
      errors.push("Prompt cannot be empty")
    }

    if (!additionalText.trim()) {
      errors.push("Additional text cannot be empty")
    }

    if (splitMethod === "count") {
      if (isNaN(splitLength) || splitLength <= 0) {
        errors.push("Characters/words per part must be a positive number")
      }
    }

    return errors
  }

  // Start processing
  const startProcessing = async () => {
    if (processing) {
      alert("A request is already being processed. Please wait.")
      return
    }

    const errors = validateInputs()
    if (errors.length > 0) {
      alert("Errors:\n" + errors.join("\n"))
      return
    }

    setProcessing(true)
    setShouldStop(false)
    setCurrentResults([])
    setCurrentProgressText("")
    setCurrentResultText("")
    setFinalResultText("")
    setProgress(0)

    // Get input values
    const data = {
      apiKey,
      model,
      language,
      splitMethod,
      splitLength,
      prompt,
      additionalText,
    }

    try {
      // First, split the text
      console.log("Splitting text...")
      const splitResponse = await fetch("/api/split-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!splitResponse.ok) {
        const errorText = await splitResponse.text()
        throw new Error("Error splitting text: " + errorText)
      }

      const splitResult = await splitResponse.json()
      const chapters = splitResult.chapters

      if (!chapters || chapters.length === 0) {
        throw new Error("No chapters found after splitting")
      }

      appendToProgressText(`Text split into ${chapters.length} parts`)

      // Process chapters sequentially
      await processChapters(data, chapters, 0)
    } catch (error) {
      console.error("Error:", error)
      showError(error instanceof Error ? error.message : String(error))
      resetProcessingState()
    }
  }

  // Process chapters one by one
  const processChapters = async (data, chapters, index) => {
    if (index >= chapters.length || shouldStop) {
      setFinalResultText(
        shouldStop
          ? "Processing stopped by user request"
          : `Processing complete. All ${chapters.length} parts processed.`,
      )
      resetProcessingState()
      return
    }

    const chapter = chapters[index]
    const newProgress = Math.round(((index + 1) / chapters.length) * 100)
    setProgress(newProgress)

    appendToProgressText(`Processing part ${index + 1}/${chapters.length}\nContent: ${chapter.substring(0, 100)}...`)

    try {
      // Process this chapter
      console.log(`Processing part ${index + 1}/${chapters.length}`)
      const processResponse = await fetch("/api/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          chapter: chapter,
          partNumber: index + 1,
          totalParts: chapters.length,
        }),
      })

      if (!processResponse.ok) {
        const errorText = await processResponse.text()
        throw new Error(`Error processing part ${index + 1}: ${errorText}`)
      }

      const processResult = await processResponse.json()
      const resultText = processResult.result

      setCurrentResultText(`Result for part ${index + 1}:\n${resultText}`)

      // Save result
      setCurrentResults((prev) => [...prev, `## Part ${index + 1}\n${resultText}`])

      // Update final result
      setFinalResultText(`Completed ${index + 1}/${chapters.length} parts`)

      // Process next chapter after delay (to avoid rate limiting)
      if (index < chapters.length - 1) {
        setTimeout(() => {
          processChapters(data, chapters, index + 1)
        }, 45000) // 45 second delay between requests
      } else {
        processChapters(data, chapters, index + 1) // Complete the process
      }
    } catch (error) {
      console.error("Error:", error)
      showError(error instanceof Error ? error.message : String(error))
      resetProcessingState()
    }
  }

  // Helper functions
  const appendToProgressText = (text) => {
    setCurrentProgressText((prev) => (prev ? prev + "\n" + text : text))
  }

  const showError = (message) => {
    alert("Error: " + message)
    setCurrentResultText("Error: " + message)
  }

  const resetProcessingState = () => {
    setProcessing(false)
    setShouldStop(false)
  }

  // Stop processing
  const stopProcessing = () => {
    setShouldStop(true)
    appendToProgressText("\nStopping processing...")
  }

  // Load results
  const loadResults = () => {
    if (currentResults.length === 0) {
      alert("No results available to load.")
      return
    }

    setCurrentResultText(currentResults.join("\n\n"))
  }

  return (
    <div className="space-y-4">
      {/* Language selection */}
      <div>
        <label htmlFor="language" className="block font-medium mb-1">
          Select Language:
        </label>
        <select
          id="language"
          className="w-full p-2 border rounded"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="ENG">ENG</option>
          <option value="中文">中文</option>
          <option value="Việt Nam">Việt Nam</option>
        </select>
      </div>

      {/* Model selection */}
      <div>
        <label htmlFor="model" className="block font-medium mb-1">
          Select Model:
        </label>
        <select
          id="model"
          className="w-full p-2 border rounded"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <option value="deepseek/deepseek-r1:free">deepseek/deepseek-r1:free</option>
          <option value="deepseek/deepseek-chat-v3-0324:free">deepseek/deepseek-chat-v3-0324:free</option>
          <option value="qwen/qwen2.5-vl-72b-instruct:free">qwen/qwen2.5-vl-72b-instruct:free</option>
          <option value="deepseek/deepseek-chat:free">deepseek/deepseek-chat:free</option>
          <option value="google/gemini-2.0-flash-lite-preview-02-05:free">
            google/gemini-2.0-flash-lite-preview-02-05:free
          </option>
          <option value="google/gemini-2.0-flash-exp:free">google/gemini-2.0-flash-exp:free</option>
          <option value="google/gemini-2.0-pro-exp-02-05:free">google/gemini-2.0-pro-exp-02-05:free</option>
          <option value="google/gemini-2.0-flash-thinking-exp:free">google/gemini-2.0-flash-thinking-exp:free</option>
          <option value="meta-llama/llama-3.3-70b-instruct:free">meta-llama/llama-3.3-70b-instruct:free</option>
        </select>
      </div>

      {/* API Key */}
      <div>
        <label htmlFor="apiKey" className="block font-medium mb-1">
          API Key:
        </label>
        <div className="flex gap-2">
          <input
            type={showApiKey ? "text" : "password"}
            id="apiKey"
            className="flex-1 p-2 border rounded"
            placeholder="Enter your OpenRouter API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Split method */}
      <div>
        <label htmlFor="splitMethod" className="block font-medium mb-1">
          Text Split Method:
        </label>
        <select
          id="splitMethod"
          className="w-full p-2 border rounded"
          value={splitMethod}
          onChange={(e) => setSplitMethod(e.target.value)}
        >
          <option value="chapter">By Chapter (第X章/Chương X)</option>
          <option value="count">By Character Count</option>
        </select>
      </div>

      {/* Split length */}
      <div>
        <label htmlFor="splitLength" className="block font-medium mb-1">
          {getSplitLengthLabel()}
        </label>
        <input
          type="number"
          id="splitLength"
          className="w-full p-2 border rounded"
          value={splitLength}
          onChange={(e) => setSplitLength(Number.parseInt(e.target.value))}
          min="1"
        />
      </div>

      {/* Prompt input */}
      <div>
        <label htmlFor="prompt" className="block font-medium mb-1">
          Enter Prompt:
        </label>
        <textarea
          id="prompt"
          className="w-full p-2 border rounded"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
      </div>

      {/* Additional text */}
      <div>
        <label htmlFor="additionalText" className="block font-medium mb-1">
          Enter Additional Text:
        </label>
        <textarea
          id="additionalText"
          className="w-full p-2 border rounded"
          rows={6}
          value={additionalText}
          onChange={(e) => setAdditionalText(e.target.value)}
        ></textarea>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded text-white ${processing ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
          onClick={startProcessing}
          disabled={processing}
        >
          Submit Request
        </button>
        <button
          className={`px-4 py-2 rounded text-white ${!processing || shouldStop ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
          onClick={stopProcessing}
          disabled={!processing || shouldStop}
        >
          Stop
        </button>
        <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" onClick={loadResults}>
          Load Results
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
          <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-right text-sm text-gray-600">{progress}%</div>
      </div>

      {/* Current progress */}
      <div>
        <label className="block font-medium mb-1">Current Processing Progress:</label>
        <div className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {currentProgressText}
        </div>
      </div>

      {/* Current result */}
      <div>
        <label className="block font-medium mb-1">Current Part Result:</label>
        <div className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {currentResultText}
        </div>
      </div>

      {/* Final result */}
      <div>
        <label className="block font-medium mb-1">Final Result:</label>
        <div className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {finalResultText}
        </div>
      </div>
    </div>
  )
}

