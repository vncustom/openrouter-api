document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const languageSelect = document.getElementById("language")
  const modelSelect = document.getElementById("model")
  const apiKeyInput = document.getElementById("apiKey")
  const toggleApiKeyBtn = document.getElementById("toggleApiKey")
  const splitMethodSelect = document.getElementById("splitMethod")
  const splitLengthInput = document.getElementById("splitLength")
  const splitLengthLabel = document.getElementById("splitLengthLabel")
  const promptTextarea = document.getElementById("prompt")
  const additionalTextarea = document.getElementById("additionalText")
  const submitBtn = document.getElementById("submitBtn")
  const stopBtn = document.getElementById("stopBtn")
  const loadBtn = document.getElementById("loadBtn")
  const progressBar = document.getElementById("progressBar")
  const progressText = document.getElementById("progressText")
  const currentProgressDiv = document.getElementById("currentProgress")
  const currentResultDiv = document.getElementById("currentResult")
  const finalResultDiv = document.getElementById("finalResult")

  // State
  let processing = false
  let shouldStop = false
  let currentResults = []

  // Toggle API key visibility
  toggleApiKeyBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text"
      toggleApiKeyBtn.textContent = "Hide"
    } else {
      apiKeyInput.type = "password"
      toggleApiKeyBtn.textContent = "Show"
    }
  })

  // Update split length label based on language
  languageSelect.addEventListener("change", () => {
    updateSplitLengthLabel()
  })

  function updateSplitLengthLabel() {
    const language = languageSelect.value
    if (language === "ENG") {
      splitLengthLabel.textContent = "Words per part:"
    } else if (language === "中文" || language === "Việt Nam") {
      splitLengthLabel.textContent = "Characters per part:"
    } else {
      splitLengthLabel.textContent = "Characters/words per part:"
    }
  }

  // Initialize label
  updateSplitLengthLabel()

  // Submit request
  submitBtn.addEventListener("click", () => {
    if (processing) {
      alert("A request is already being processed. Please wait.")
      return
    }

    const errors = validateInputs()
    if (errors.length > 0) {
      alert("Errors:\n" + errors.join("\n"))
      return
    }

    startProcessing()
  })

  // Stop processing
  stopBtn.addEventListener("click", () => {
    shouldStop = true
    appendToElement(currentProgressDiv, "\nStopping processing...")
    stopBtn.disabled = true
  })

  // Load results
  loadBtn.addEventListener("click", () => {
    if (currentResults.length === 0) {
      alert("No results available to load.")
      return
    }

    currentResultDiv.textContent = currentResults.join("\n\n")
  })

  // Validate inputs
  function validateInputs() {
    const errors = []

    if (!apiKeyInput.value.trim()) {
      errors.push("API Key is required")
    }

    if (!promptTextarea.value.trim()) {
      errors.push("Prompt cannot be empty")
    }

    if (!additionalTextarea.value.trim()) {
      errors.push("Additional text cannot be empty")
    }

    if (splitMethodSelect.value === "count") {
      const splitLength = Number.parseInt(splitLengthInput.value)
      if (isNaN(splitLength) || splitLength <= 0) {
        errors.push("Characters/words per part must be a positive number")
      }
    }

    return errors
  }

  // Start processing
  function startProcessing() {
    processing = true
    shouldStop = false
    currentResults = []

    submitBtn.disabled = true
    stopBtn.disabled = false

    // Clear result areas
    currentProgressDiv.textContent = ""
    currentResultDiv.textContent = ""
    finalResultDiv.textContent = ""

    // Get input values
    const data = {
      apiKey: apiKeyInput.value,
      model: modelSelect.value,
      language: languageSelect.value,
      splitMethod: splitMethodSelect.value,
      splitLength: Number.parseInt(splitLengthInput.value),
      prompt: promptTextarea.value,
      additionalText: additionalTextarea.value,
    }

    // First, split the text
    fetch("/api/split-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error("Error splitting text: " + text)
          })
        }
        return response.json()
      })
      .then((result) => {
        const chapters = result.chapters
        if (!chapters || chapters.length === 0) {
          throw new Error("No chapters found after splitting")
        }

        appendToElement(currentProgressDiv, `Text split into ${chapters.length} parts`)

        // Set up progress bar
        progressBar.style.width = "0%"
        progressText.textContent = "0%"

        // Process chapters sequentially
        processChapters(data, chapters, 0)
      })
      .catch((error) => {
        showError(error.message)
        resetProcessingState()
      })
  }

  // Process chapters one by one
  function processChapters(data, chapters, index) {
    if (index >= chapters.length || shouldStop) {
      finalResultDiv.textContent = shouldStop
        ? "Processing stopped by user request"
        : `Processing complete. All ${chapters.length} parts processed.`
      resetProcessingState()
      return
    }

    const chapter = chapters[index]
    const progress = Math.round(((index + 1) / chapters.length) * 100)

    progressBar.style.width = `${progress}%`
    progressText.textContent = `${progress}%`

    appendToElement(
      currentProgressDiv,
      `Processing part ${index + 1}/${chapters.length}\nContent: ${chapter.substring(0, 100)}...`,
    )

    // Process this chapter
    fetch("/api/process-text", {
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
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`Error processing part ${index + 1}: ${text}`)
          })
        }
        return response.json()
      })
      .then((result) => {
        const resultText = result.result
        currentResultDiv.textContent = `Result for part ${index + 1}:\n${resultText}`

        // Save result
        currentResults.push(`## Part ${index + 1}\n${resultText}`)

        // Update final result
        finalResultDiv.textContent = `Completed ${index + 1}/${chapters.length} parts`

        // Process next chapter after delay (to avoid rate limiting)
        setTimeout(
          () => {
            processChapters(data, chapters, index + 1)
          },
          index < chapters.length - 1 ? 45000 : 0,
        ) // 45 second delay between requests
      })
      .catch((error) => {
        showError(error.message)
        resetProcessingState()
      })
  }

  // Helper functions
  function appendToElement(element, text) {
    element.textContent = element.textContent ? element.textContent + "\n" + text : text
  }

  function showError(message) {
    alert("Error: " + message)
    currentResultDiv.textContent = "Error: " + message
  }

  function resetProcessingState() {
    processing = false
    submitBtn.disabled = false
    stopBtn.disabled = true
  }
})

