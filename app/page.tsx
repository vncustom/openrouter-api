import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-6">OpenRouter AI Interface</h1>

        {/* Language selection */}
        <div className="mb-4">
          <label htmlFor="language" className="block font-medium mb-1">
            Select Language:
          </label>
          <select id="language" className="w-full p-2 border rounded">
            <option value="ENG">ENG</option>
            <option value="中文" selected>
              中文
            </option>
            <option value="Việt Nam">Việt Nam</option>
          </select>
        </div>

        {/* Model selection */}
        <div className="mb-4">
          <label htmlFor="model" className="block font-medium mb-1">
            Select Model:
          </label>
          <select id="model" className="w-full p-2 border rounded">
            <option value="deepseek/deepseek-r1:free" selected>
              deepseek/deepseek-r1:free
            </option>
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
        <div className="mb-4">
          <label htmlFor="apiKey" className="block font-medium mb-1">
            API Key:
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              id="apiKey"
              className="flex-1 p-2 border rounded"
              placeholder="Enter your OpenRouter API key"
            />
            <button id="toggleApiKey" className="px-4 py-2 bg-gray-200 rounded">
              Show
            </button>
          </div>
        </div>

        {/* Split method */}
        <div className="mb-4">
          <label htmlFor="splitMethod" className="block font-medium mb-1">
            Text Split Method:
          </label>
          <select id="splitMethod" className="w-full p-2 border rounded">
            <option value="chapter" selected>
              By Chapter (第X章/Chương X)
            </option>
            <option value="count">By Character Count</option>
          </select>
        </div>

        {/* Split length */}
        <div className="mb-4">
          <label id="splitLengthLabel" htmlFor="splitLength" className="block font-medium mb-1">
            Characters per part:
          </label>
          <input type="number" id="splitLength" className="w-full p-2 border rounded" value="1000" min="1" />
        </div>

        {/* Prompt input */}
        <div className="mb-4">
          <label htmlFor="prompt" className="block font-medium mb-1">
            Enter Prompt:
          </label>
          <textarea id="prompt" className="w-full p-2 border rounded" rows={4}></textarea>
        </div>

        {/* Additional text */}
        <div className="mb-4">
          <label htmlFor="additionalText" className="block font-medium mb-1">
            Enter Additional Text:
          </label>
          <textarea id="additionalText" className="w-full p-2 border rounded" rows={6}></textarea>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button id="submitBtn" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Submit Request
          </button>
          <button id="stopBtn" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" disabled>
            Stop
          </button>
          <button id="loadBtn" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Load Results
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
            <div id="progressBar" className="bg-blue-500 h-4 rounded-full" style={{ width: "0%" }}></div>
          </div>
          <div id="progressText" className="text-right text-sm text-gray-600">
            0%
          </div>
        </div>

        {/* Current progress */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Current Processing Progress:</label>
          <div
            id="currentProgress"
            className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto"
          ></div>
        </div>

        {/* Current result */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Current Part Result:</label>
          <div
            id="currentResult"
            className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto"
          ></div>
        </div>

        {/* Final result */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Final Result:</label>
          <div
            id="finalResult"
            className="border p-3 rounded bg-gray-50 min-h-[80px] max-h-[200px] overflow-y-auto"
          ></div>
        </div>
      </div>
    </main>
  )
}

