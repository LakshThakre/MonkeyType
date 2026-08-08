import type { TestMode } from "@/types/typing"
import { Timer, Zap, Target } from "lucide-react"

interface LiveStatsProps {
  status: "idle" | "running" | "finished"
  mode: TestMode
  timeLeft: number
  netWpm: number
  accuracy: number
  wordIndex: number
  totalWords: number
}

export const LiveStats = ({
  status,
  mode,
  timeLeft,
  netWpm,
  accuracy,
  wordIndex,
  totalWords
}: LiveStatsProps) => {
  if (status === "finished") return null

  return (
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 text-sm font-mono tracking-wider transition-opacity duration-300">
      {/* Timer / Progress */}
      <div className="flex items-center gap-2 font-bold text-primary text-xl sm:text-2xl">
        <Timer className="w-5 h-5 text-primary animate-pulse" />
        {mode === "time" ? (
          <span>{timeLeft}s</span>
        ) : (
          <span>
            {wordIndex} / {totalWords}
          </span>
        )}
      </div>

      {/* Running WPM & Accuracy */}
      <div className="flex items-center gap-6 text-muted-foreground text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          <span>WPM:</span>
          <span className="font-bold text-foreground text-base">{status === "idle" ? 0 : netWpm}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" />
          <span>ACC:</span>
          <span className="font-bold text-foreground text-base">{status === "idle" ? 100 : accuracy}%</span>
        </div>
      </div>
    </div>
  )
}
