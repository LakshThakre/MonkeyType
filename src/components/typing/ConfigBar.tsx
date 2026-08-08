import type { TestSettings, TimeOption, WordOption, ThemeId } from "@/types/typing"
import {
  Clock,
  Type,
  Quote,
  AtSign,
  Hash,
  Volume2,
  VolumeX,
  History,
  Sun,
  Moon
} from "lucide-react"

interface ConfigBarProps {
  settings: TestSettings
  onUpdateSettings: (newSettings: Partial<TestSettings>) => void
  onOpenHistory: () => void
}

export const ConfigBar = ({
  settings,
  onUpdateSettings,
  onOpenHistory
}: ConfigBarProps) => {
  const isDark = settings.theme === "mono-dark"

  const toggleTheme = () => {
    const nextTheme: ThemeId = isDark ? "mono-light" : "mono-dark"
    onUpdateSettings({ theme: nextTheme })
  }

  return (
    <header className="w-full max-w-4xl mx-auto px-4 transition-all duration-200">
      <div className="bg-card border border-white/10 dark:border-white/10 rounded-xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-medium">
        
        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-white/10 dark:border-white/10">
          <button
            onClick={() => onUpdateSettings({ mode: "time" })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              settings.mode === "time"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>time</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ mode: "words" })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              settings.mode === "words"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>words</span>
          </button>

          <button
            onClick={() => onUpdateSettings({ mode: "quote" })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              settings.mode === "quote"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>quote</span>
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-white/10 dark:bg-white/10" />

        {/* Mode options: time duration or word count */}
        {settings.mode === "time" && (
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-white/10 dark:border-white/10">
            {([15, 30, 60, 120] as TimeOption[]).map((t) => (
              <button
                key={t}
                onClick={() => onUpdateSettings({ time: t })}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  settings.time === t
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        )}

        {settings.mode === "words" && (
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-white/10 dark:border-white/10">
            {([10, 25, 50, 100] as WordOption[]).map((w) => (
              <button
                key={w}
                onClick={() => onUpdateSettings({ wordsCount: w })}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  settings.wordsCount === w
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}

        {/* Toggle Modifiers (Punctuation, Numbers) */}
        {settings.mode !== "quote" && (
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-white/10 dark:border-white/10">
            <button
              onClick={() => onUpdateSettings({ includePunctuation: !settings.includePunctuation })}
              title="Toggle Punctuation"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                settings.includePunctuation
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AtSign className="w-3.5 h-3.5" />
              <span className="hidden md:inline">punc</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ includeNumbers: !settings.includeNumbers })}
              title="Toggle Numbers"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                settings.includeNumbers
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span className="hidden md:inline">nums</span>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-white/10 dark:bg-white/10" />

        {/* Tools: Theme Toggle (Icon Only), Audio & History */}
        <div className="flex items-center gap-2">
          {/* Icon-Only Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-background text-muted-foreground hover:text-foreground border border-white/10 dark:border-white/10 transition-all cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-2 rounded-lg border border-white/10 dark:border-white/10 transition-all cursor-pointer ${
              settings.soundEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
            title={settings.soundEnabled ? "Sound Effects Enabled" : "Sound Muted"}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-lg bg-background text-muted-foreground hover:text-foreground border border-white/10 dark:border-white/10 transition-all cursor-pointer"
            title="View History & Personal Bests"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  )
}
