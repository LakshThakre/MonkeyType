import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type {
  TestSettings,
  WordState,
  CharState,
  WpmDataPoint,
  TestResult,
  CharBreakdown
} from "@/types/typing"
import { generateWordList, getRandomQuote } from "@/data/words"
import { playKeySound } from "@/lib/sound"

/**
 * Typing Engine with exact 1s timer decrementing (15 -> 14 -> 13 -> 12).
 */

export function useTypingEngine(settings: TestSettings) {
  const [status, setStatus] = useState<"idle" | "running" | "finished">("idle")
  const [words, setWords] = useState<WordState[]>([])
  const [wordIndex, setWordIndex] = useState(0)
  const [typedInput, setTypedInput] = useState("")
  const [timeLeft, setTimeLeft] = useState<number>(settings.time)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [wpmData, setWpmData] = useState<WpmDataPoint[]>([])
  const [capsLock, setCapsLock] = useState(false)
  const [lastResult, setLastResult] = useState<TestResult | null>(null)
  const [quoteAuthor, setQuoteAuthor] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const rawWpmHistoryRef = useRef<number[]>([])
  const hasFinishedRef = useRef(false)

  // Always keep refs updated with latest state so timer interval doesn't need to restart
  const wordsRef = useRef<WordState[]>([])
  wordsRef.current = words

  const wordIndexRef = useRef(0)
  wordIndexRef.current = wordIndex

  const settingsRef = useRef<TestSettings>(settings)
  settingsRef.current = settings

  // Keystroke-level counters
  const correctKeystrokesRef = useRef(0)
  const incorrectKeystrokesRef = useRef(0)
  const totalKeystrokesRef = useRef(0)

  // Track error seconds
  const errorSecondsRef = useRef<Set<number>>(new Set())
  const prevErrorCountRef = useRef(0)

  // Initialize test
  const initTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    hasFinishedRef.current = false
    setStatus("idle")
    setWordIndex(0)
    setTypedInput("")
    setElapsedTime(0)
    setTimeLeft(settings.time)
    setWpmData([])
    setLastResult(null)
    startTimeRef.current = null
    rawWpmHistoryRef.current = []
    correctKeystrokesRef.current = 0
    incorrectKeystrokesRef.current = 0
    totalKeystrokesRef.current = 0
    errorSecondsRef.current = new Set()
    prevErrorCountRef.current = 0

    let initialWords: string[] = []

    if (settings.mode === "quote") {
      const q = getRandomQuote()
      setQuoteAuthor(q.author)
      initialWords = q.text.split(" ")
    } else if (settings.mode === "time") {
      setQuoteAuthor(null)
      initialWords = generateWordList(100, settings.includePunctuation, settings.includeNumbers)
    } else {
      setQuoteAuthor(null)
      initialWords = generateWordList(settings.wordsCount, settings.includePunctuation, settings.includeNumbers)
    }

    const formattedWords: WordState[] = initialWords.map((word) => ({
      original: word,
      typed: "",
      chars: word.split("").map((c) => ({ char: c, status: "untyped" })),
      hasError: false
    }))

    setWords(formattedWords)
  }, [settings.mode, settings.time, settings.wordsCount, settings.includePunctuation, settings.includeNumbers])

  useEffect(() => {
    initTest()
  }, [initTest])

  // Character breakdown calculation
  const charStats = useMemo<CharBreakdown>(() => {
    let correct = 0
    let incorrect = 0
    let extra = 0
    let missed = 0

    words.forEach((w, idx) => {
      if (idx > wordIndex && status !== "finished") return

      w.chars.forEach((c) => {
        if (c.status === "correct") correct++
        else if (c.status === "incorrect") incorrect++
        else if (c.status === "extra") extra++
        else if (c.status === "untyped" && (idx < wordIndex || status === "finished")) missed++
      })
    })

    const submittedSpaces = Math.max(0, wordIndex)
    correct += submittedSpaces

    return { correct, incorrect, extra, missed }
  }, [words, wordIndex, status])

  // Live WPM calculation
  const liveStats = useMemo(() => {
    let elapsedMs = 0
    if (startTimeRef.current && status === "running") {
      elapsedMs = Date.now() - startTimeRef.current
    } else if (elapsedTime > 0) {
      elapsedMs = elapsedTime * 1000
    }

    const timeInMins = Math.max(elapsedMs / 1000, 1) / 60
    const netWpm = Math.round((charStats.correct / 5) / timeInMins)
    const totalTyped = charStats.correct + charStats.incorrect + charStats.extra
    const rawWpm = Math.round((totalTyped / 5) / timeInMins)

    const keystrokeTotal = correctKeystrokesRef.current + incorrectKeystrokesRef.current
    const accuracy = keystrokeTotal > 0
      ? Math.round((correctKeystrokesRef.current / keystrokeTotal) * 100)
      : 100

    return { netWpm: Math.max(0, netWpm), rawWpm: Math.max(0, rawWpm), accuracy }
  }, [charStats, elapsedTime, status])

  const calculateConsistency = (history: number[]): number => {
    if (history.length < 2) return 100
    const mean = history.reduce((a, b) => a + b, 0) / history.length
    if (mean === 0) return 100
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length
    const stdDev = Math.sqrt(variance)
    const coefficientOfVariation = stdDev / mean
    return Math.max(0, Math.min(100, Math.round((1 - coefficientOfVariation) * 100)))
  }

  // Finish test — guaranteed to execute EXACTLY ONCE per test session
  const finishTest = useCallback(() => {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true

    if (timerRef.current) clearInterval(timerRef.current)
    setStatus("finished")

    if (settingsRef.current.soundEnabled) {
      playKeySound("finish")
    }

    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : elapsedTime * 1000
    const durationSecs = Math.max(1, Math.round(elapsedMs / 1000))
    const timeInMins = durationSecs / 60

    let totalCorrect = 0
    let totalIncorrect = 0
    let totalExtra = 0
    let totalMissed = 0

    wordsRef.current.forEach((w) => {
      w.chars.forEach((c) => {
        if (c.status === "correct") totalCorrect++
        else if (c.status === "incorrect") totalIncorrect++
        else if (c.status === "extra") totalExtra++
        else if (c.status === "untyped") totalMissed++
      })
    })

    const submittedSpaces = Math.max(0, wordIndexRef.current)
    totalCorrect += submittedSpaces

    const totalCharsTyped = totalCorrect + totalIncorrect + totalExtra
    const netWpm = Math.max(0, Math.round((totalCorrect / 5) / timeInMins))
    const rawWpm = Math.max(0, Math.round((totalCharsTyped / 5) / timeInMins))

    const keystrokeTotal = correctKeystrokesRef.current + incorrectKeystrokesRef.current
    const accuracy = keystrokeTotal > 0
      ? Math.round((correctKeystrokesRef.current / keystrokeTotal) * 100)
      : 100

    const consistency = calculateConsistency(rawWpmHistoryRef.current)

    const breakdown: CharBreakdown = {
      correct: totalCorrect,
      incorrect: totalIncorrect,
      extra: totalExtra,
      missed: totalMissed
    }

    const currentMode = settingsRef.current.mode
    const currentTimeSetting = settingsRef.current.time
    const currentWordsSetting = settingsRef.current.wordsCount

    const result: TestResult = {
      id: "result-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      mode: currentMode,
      modeValue: currentMode === "time"
        ? `${currentTimeSetting}s`
        : currentMode === "words"
          ? `${currentWordsSetting} words`
          : "quote",
      wpm: netWpm,
      rawWpm,
      accuracy,
      consistency,
      charStats: breakdown,
      chartData: wpmData.length > 0
        ? wpmData
        : [{ second: 1, wpm: netWpm, rawWpm, errors: totalIncorrect }],
      theme: "mono-light",
      elapsedSeconds: durationSecs,
      totalKeystrokes: totalKeystrokesRef.current,
      errorSeconds: Array.from(errorSecondsRef.current)
    }

    try {
      const existingHistory: TestResult[] = JSON.parse(localStorage.getItem("monkeytype_history") || "[]")
      const updatedHistory = [result, ...existingHistory].slice(0, 50)
      localStorage.setItem("monkeytype_history", JSON.stringify(updatedHistory))

      const currentPb = Number(localStorage.getItem("monkeytype_pb") || "0")
      if (netWpm > currentPb) {
        localStorage.setItem("monkeytype_pb", String(netWpm))
        result.isPersonalBest = true
      }
    } catch (e) {
      // Storage fallback
    }

    setLastResult(result)
  }, [elapsedTime, wpmData])

  // Store finishTest in ref so useEffect has 0 dependencies other than status
  const finishTestRef = useRef(finishTest)
  finishTestRef.current = finishTest

  // Timer tick (once per second) — DEPENDS EXCLUSIVELY ON `status`
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prevElapsed) => {
          const nextElapsed = prevElapsed + 1

          if (settingsRef.current.mode === "time") {
            const nextTimeLeft = Math.max(0, settingsRef.current.time - nextElapsed)
            setTimeLeft(nextTimeLeft)
            if (nextTimeLeft <= 0) {
              finishTestRef.current()
            }
          }

          const timeMins = nextElapsed / 60

          let currentCorrect = 0
          let currentIncorrect = 0
          let currentExtra = 0

          wordsRef.current.forEach((w) => {
            w.chars.forEach((c) => {
              if (c.status === "correct") currentCorrect++
              else if (c.status === "incorrect") currentIncorrect++
              else if (c.status === "extra") currentExtra++
            })
          })

          const currentSpaces = Math.max(0, wordIndexRef.current)
          currentCorrect += currentSpaces

          const currentTyped = currentCorrect + currentIncorrect + currentExtra
          const currentNetWpm = Math.max(0, (currentCorrect / 5) / timeMins)
          const currentRawWpm = Math.max(0, (currentTyped / 5) / timeMins)

          rawWpmHistoryRef.current.push(currentRawWpm)

          const totalErrors = currentIncorrect + currentExtra
          const newErrorsThisTick = Math.max(0, totalErrors - prevErrorCountRef.current)
          prevErrorCountRef.current = totalErrors

          if (newErrorsThisTick > 0) {
            errorSecondsRef.current.add(nextElapsed)
          }

          setWpmData((prevData) => [
            ...prevData,
            {
              second: nextElapsed,
              wpm: Math.round(currentNetWpm * 10) / 10,
              rawWpm: Math.round(currentRawWpm * 10) / 10,
              errors: newErrorsThisTick
            }
          ])

          return nextElapsed
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  // Key Input Handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setCapsLock(e.getModifierState("CapsLock"))

      if (status === "finished") return

      if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault()
        initTest()
        return
      }

      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.key === "Shift" ||
        e.key === "CapsLock" ||
        e.key.startsWith("F")
      ) {
        return
      }

      if (status === "idle") {
        setStatus("running")
        startTimeRef.current = Date.now()
      }

      const currentWord = words[wordIndex]
      if (!currentWord) return

      // Handle Space
      if (e.key === " ") {
        e.preventDefault()
        if (typedInput.length === 0) return

        totalKeystrokesRef.current++
        correctKeystrokesRef.current++

        if (settings.soundEnabled) {
          playKeySound("click")
        }

        const isLastWord = wordIndex === words.length - 1

        if (isLastWord || (settings.mode === "words" && wordIndex + 1 === settings.wordsCount)) {
          finishTest()
          return
        }

        if (settings.mode === "time" && wordIndex >= words.length - 15) {
          const newBatch = generateWordList(30, settings.includePunctuation, settings.includeNumbers).map((word) => ({
            original: word,
            typed: "",
            chars: word.split("").map((c) => ({ char: c, status: "untyped" as const })),
            hasError: false
          }))
          setWords((prev) => [...prev, ...newBatch])
        }

        setWordIndex((prev) => prev + 1)
        setTypedInput("")
        return
      }

      // Handle Backspace
      if (e.key === "Backspace") {
        e.preventDefault()
        totalKeystrokesRef.current++

        if (settings.soundEnabled) {
          playKeySound("backspace")
        }

        if (typedInput.length > 0) {
          const newTyped = typedInput.slice(0, -1)
          setTypedInput(newTyped)

          setWords((prevWords) => {
            const next = [...prevWords]
            const targetWord = { ...next[wordIndex] }
            const original = targetWord.original

            const newChars: CharState[] = original.split("").map((c, idx) => {
              if (idx < newTyped.length) {
                return {
                  char: c,
                  status: newTyped[idx] === c ? "correct" : "incorrect"
                }
              }
              return { char: c, status: "untyped" }
            })

            if (newTyped.length > original.length) {
              const extraChars = newTyped.slice(original.length).split("")
              extraChars.forEach((extraC) => {
                newChars.push({ char: extraC, status: "extra" })
              })
            }

            targetWord.typed = newTyped
            targetWord.chars = newChars
            targetWord.hasError = newChars.some((c) => c.status === "incorrect" || c.status === "extra")
            next[wordIndex] = targetWord
            return next
          })
        } else if (wordIndex > 0) {
          const prevWord = words[wordIndex - 1]
          if (prevWord && prevWord.hasError) {
            setWordIndex(wordIndex - 1)
            setTypedInput(prevWord.typed)
          }
        }
        return
      }

      // Handle Character input
      if (e.key.length === 1) {
        e.preventDefault()

        const charTyped = e.key
        const newTyped = typedInput + charTyped
        setTypedInput(newTyped)

        const original = currentWord.original
        const isCharCorrect =
          newTyped.length <= original.length && charTyped === original[newTyped.length - 1]

        totalKeystrokesRef.current++
        if (isCharCorrect) {
          correctKeystrokesRef.current++
        } else {
          incorrectKeystrokesRef.current++
        }

        if (settings.soundEnabled) {
          playKeySound(isCharCorrect ? "click" : "error")
        }

        setWords((prevWords) => {
          const next = [...prevWords]
          const targetWord = { ...next[wordIndex] }

          const newChars: CharState[] = original.split("").map((c, idx) => {
            if (idx < newTyped.length) {
              return {
                char: c,
                status: newTyped[idx] === c ? "correct" : "incorrect"
              }
            }
            return { char: c, status: "untyped" }
          })

          if (newTyped.length > original.length) {
            const extraChars = newTyped.slice(original.length).split("")
            extraChars.forEach((extraC) => {
              newChars.push({ char: extraC, status: "extra" })
            })
          }

          targetWord.typed = newTyped
          targetWord.chars = newChars
          targetWord.hasError = newChars.some((c) => c.status === "incorrect" || c.status === "extra")
          next[wordIndex] = targetWord
          return next
        })

        if (
          (settings.mode === "words" || settings.mode === "quote") &&
          wordIndex === words.length - 1 &&
          newTyped.length >= original.length
        ) {
          finishTest()
        }
      }
    },
    [status, words, wordIndex, typedInput, settings, finishTest, initTest]
  )

  return {
    status,
    words,
    wordIndex,
    typedInput,
    timeLeft,
    elapsedTime,
    liveStats,
    charStats,
    capsLock,
    lastResult,
    quoteAuthor,
    handleKeyDown,
    initTest,
    finishTest
  }
}
