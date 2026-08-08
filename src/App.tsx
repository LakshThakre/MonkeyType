import { useState, useEffect } from "react"
import type { TestSettings, ThemeId } from "@/types/typing"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { ConfigBar } from "@/components/typing/ConfigBar"
import { TypingArea } from "@/components/typing/TypingArea"
import { LiveStats } from "@/components/typing/LiveStats"
import { ResultsScreen } from "@/components/typing/ResultsScreen"
import { HistoryDrawer } from "@/components/typing/HistoryDrawer"
import { Keyboard, Trophy, RotateCcw, Sun, Moon } from "lucide-react"

const DEFAULT_SETTINGS: TestSettings = {
  mode: "time",
  time: 30,
  wordsCount: 25,
  includePunctuation: false,
  includeNumbers: false,
  soundEnabled: true,
  theme: "mono-light"
}

export default function App() {
  const [settings, setSettings] = useState<TestSettings>(() => {
    try {
      const saved = localStorage.getItem("monkeytype_settings")
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [personalBest, setPersonalBest] = useState<number>(0)

  // Sync theme attribute to html
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme)
    if (settings.theme === "mono-dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    try {
      localStorage.setItem("monkeytype_settings", JSON.stringify(settings))
    } catch (e) {
      // Storage fallback
    }
  }, [settings])

  // Clean up legacy storage keys & load personal best
  useEffect(() => {
    try {
      localStorage.removeItem("keypulse_pb")
      localStorage.removeItem("keypulse_history")
      localStorage.removeItem("keypulse_settings")
      const pb = Number(localStorage.getItem("monkeytype_pb") || "0")
      setPersonalBest(pb)
    } catch {
      setPersonalBest(0)
    }
  }, [])

  const engine = useTypingEngine(settings)

  const updateSettings = (newPartial: Partial<TestSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }))
  }

  // Icon-only Dark/Light Mode Toggle
  const toggleTheme = () => {
    const nextTheme: ThemeId = settings.theme === "mono-dark" ? "mono-light" : "mono-dark"
    updateSettings({ theme: nextTheme })
  }

  const isDark = settings.theme === "mono-dark"

  // Update personal best when test finishes
  useEffect(() => {
    if (engine.status === "finished" && engine.lastResult) {
      if (engine.lastResult.wpm > personalBest) {
        setPersonalBest(engine.lastResult.wpm)
        try {
          localStorage.setItem("monkeytype_pb", String(engine.lastResult.wpm))
        } catch {
          // ignore
        }
      }
    }
  }, [engine.status, engine.lastResult, personalBest])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-8 transition-colors duration-150 font-sans select-none">
      
      {/* Top Application Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 mb-4">
        {/* Brand Logo & Name: monkeytype */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={engine.initTest}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-mono font-bold tracking-tight leading-none text-foreground flex items-center gap-1.5 lowercase">
              monkeytype
            </h1>
          </div>
        </div>

        {/* Personal Best Display & Icon-Only Dark/Light Toggle */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {personalBest > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-white/10 dark:border-white/10 text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span>PB:</span>
              <strong className="text-primary font-bold text-sm">{personalBest} WPM</strong>
            </div>
          )}

          {/* Icon-Only Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-card border border-white/10 hover:text-foreground text-muted-foreground transition-all cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>
        </div>
      </header>

      {/* Main Experience Layout */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto space-y-8 my-auto">
        {engine.status !== "finished" ? (
          <>
            {/* Config Bar */}
            <ConfigBar
              settings={settings}
              onUpdateSettings={updateSettings}
              onOpenHistory={() => setIsHistoryOpen(true)}
            />

            {/* Live Stats */}
            <LiveStats
              status={engine.status}
              mode={settings.mode}
              timeLeft={engine.timeLeft}
              netWpm={engine.liveStats.netWpm}
              accuracy={engine.liveStats.accuracy}
              wordIndex={engine.wordIndex}
              totalWords={engine.words.length}
            />

            {/* Typing Area */}
            <TypingArea
              words={engine.words}
              wordIndex={engine.wordIndex}
              typedInput={engine.typedInput}
              capsLock={engine.capsLock}
              quoteAuthor={engine.quoteAuthor}
              status={engine.status}
              onKeyDown={engine.handleKeyDown}
            />
          </>
        ) : (
          engine.lastResult && (
            <ResultsScreen
              result={engine.lastResult}
              onRestart={engine.initTest}
              onNextTest={engine.initTest}
            />
          )
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-5xl mx-auto pt-8 pb-2 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground border-t border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={engine.initTest}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>restart test</span>
          </button>
          <span>•</span>
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <kbd className="px-1.5 py-0.5 bg-card border border-white/10 rounded">tab</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-card border border-white/10 rounded">enter</kbd> restart
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span>monkeytype</span>
        </div>
      </footer>

      {/* History Drawer Modal */}
      <HistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}
