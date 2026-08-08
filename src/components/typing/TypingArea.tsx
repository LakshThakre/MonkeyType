import { useRef, useEffect, useState } from "react"
import type { KeyboardEvent } from "react"
import type { WordState } from "@/types/typing"
import { AlertCircle, MousePointerClick } from "lucide-react"

interface TypingAreaProps {
  words: WordState[]
  wordIndex: number
  typedInput: string
  capsLock: boolean
  quoteAuthor?: string | null
  status: "idle" | "running" | "finished"
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

export const TypingArea = ({
  words,
  wordIndex,
  typedInput,
  capsLock,
  quoteAuthor,
  onKeyDown
}: TypingAreaProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({})
  const [isFocused, setIsFocused] = useState(true)

  const [caretPos, setCaretPos] = useState<{ left: number; top: number; height: number }>({
    left: 0,
    top: 0,
    height: 32
  })

  // Auto-focus input on click or mount
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
      setIsFocused(true)
    }
  }

  useEffect(() => {
    focusInput()
  }, [])

  // Position caret smoothly relative to active character
  useEffect(() => {
    if (!containerRef.current || words.length === 0) return

    const charKey = `${wordIndex}-${typedInput.length}`
    const activeCharEl = charRefs.current[charKey]

    if (activeCharEl) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const charRect = activeCharEl.getBoundingClientRect()

      setCaretPos({
        left: charRect.left - containerRect.left,
        top: charRect.top - containerRect.top + 4,
        height: charRect.height * 0.85
      })
    } else {
      // If at end of word
      const lastCharKey = `${wordIndex}-${Math.max(0, typedInput.length - 1)}`
      const lastCharEl = charRefs.current[lastCharKey]
      if (lastCharEl) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const charRect = lastCharEl.getBoundingClientRect()

        setCaretPos({
          left: charRect.right - containerRect.left,
          top: charRect.top - containerRect.top + 4,
          height: charRect.height * 0.85
        })
      }
    }
  }, [wordIndex, typedInput, words])

  // Scroll active word into view smoothly
  useEffect(() => {
    const activeCharKey = `${wordIndex}-0`
    const activeWordEl = charRefs.current[activeCharKey]?.parentElement
    if (activeWordEl && containerRef.current) {
      const container = containerRef.current
      const wordTop = activeWordEl.offsetTop
      const containerHeight = container.clientHeight
      if (wordTop > containerHeight / 2) {
        container.scrollTo({ top: wordTop - containerHeight / 3, behavior: "smooth" })
      } else {
        container.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }, [wordIndex])

  return (
    <div
      onClick={focusInput}
      className="relative w-full max-w-4xl mx-auto cursor-text select-none focus:outline-none"
    >
      {/* Caps Lock Alert */}
      {capsLock && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-full animate-bounce">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Caps Lock is ON</span>
        </div>
      )}

      {/* Hidden Keystroke Receiver Input */}
      <input
        ref={inputRef}
        type="text"
        value={typedInput}
        onKeyDown={onKeyDown}
        onChange={() => {}} // Controlled by onKeyDown for speed & precision
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="opacity-0 absolute inset-0 w-full h-full cursor-default z-0 focus:outline-none"
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Unfocused Overlay */}
      {!isFocused && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 transition-all duration-300">
          <div className="p-3 bg-card rounded-full text-foreground animate-pulse">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Click or press any key to focus</p>
        </div>
      )}

      {/* Words Typing Container */}
      <div
        ref={containerRef}
        className="relative min-h-[160px] max-h-[220px] overflow-hidden rounded-2xl p-6 sm:p-8 bg-card/60 border border-white/10 transition-all"
      >
        {/* Animated Caret */}
        {isFocused && (
          <div
            className="caret-smooth"
            style={{
              left: `${caretPos.left}px`,
              top: `${caretPos.top}px`,
              height: `${caretPos.height}px`
            }}
          />
        )}

        {/* Word Grid Display */}
        <div className="flex flex-wrap gap-x-3.5 gap-y-3 text-xl sm:text-2xl font-mono leading-relaxed tracking-wide">
          {words.map((wordObj, wIdx) => {
            const isActiveWord = wIdx === wordIndex
            const isPassedWord = wIdx < wordIndex

            return (
              <span
                key={wIdx}
                className={`relative inline-flex rounded px-1 transition-colors duration-150 ${
                  isActiveWord ? "bg-white/5" : ""
                } ${wordObj.hasError && isPassedWord ? "word-has-error" : ""}`}
              >
                {wordObj.chars.map((charObj, cIdx) => {
                  const key = `${wIdx}-${cIdx}`
                  return (
                    <span
                      key={cIdx}
                      ref={(el) => {
                        charRefs.current[key] = el
                      }}
                      className={`relative transition-colors ${
                        charObj.status === "correct"
                          ? "char-correct"
                          : charObj.status === "incorrect"
                          ? "char-incorrect font-bold"
                          : charObj.status === "extra"
                          ? "char-extra font-bold"
                          : "char-untyped"
                      }`}
                    >
                      {charObj.char}
                    </span>
                  );
                })}
              </span>
            )
          })}
        </div>

        {/* Quote Author Tag */}
        {quoteAuthor && (
          <div className="mt-6 text-right text-xs italic text-muted-foreground font-sans">
            — {quoteAuthor}
          </div>
        )}
      </div>
    </div>
  )
}
