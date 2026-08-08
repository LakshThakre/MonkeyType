import { useState, useEffect } from "react"
import type { TestResult } from "@/types/typing"
import {
  X,
  Trophy,
  History,
  Trash2
} from "lucide-react"

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const HistoryDrawer = ({ isOpen, onClose }: HistoryDrawerProps) => {
  const [history, setHistory] = useState<TestResult[]>([])

  const loadHistory = () => {
    try {
      const data = localStorage.getItem("monkeytype_history")
      if (data) {
        const parsed: TestResult[] = JSON.parse(data)
        const unique = parsed.filter((item, idx, self) => self.findIndex((t) => t.id === item.id) === idx)
        setHistory(unique)
      } else {
        setHistory([])
      }
    } catch (e) {
      setHistory([])
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your typing test history and highest scores?")) {
      localStorage.removeItem("monkeytype_history")
      localStorage.removeItem("monkeytype_pb")
      localStorage.removeItem("keypulse_history")
      localStorage.removeItem("keypulse_pb")
      setHistory([])
      window.location.reload()
    }
  }

  if (!isOpen) return null

  const bestWpm = history.reduce((max, item) => (item.wpm > max ? item.wpm : max), 0)
  const avgWpm =
    history.length > 0
      ? Math.round(history.reduce((sum, item) => sum + item.wpm, 0) / history.length)
      : 0
  const avgAcc =
    history.length > 0
      ? Math.round(history.reduce((sum, item) => sum + item.accuracy, 0) / history.length)
      : 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300 text-foreground">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold font-mono text-foreground">Test History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Summary Stats */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-background p-3 rounded-xl border border-white/10 text-center font-mono">
              <span className="text-[10px] uppercase text-muted-foreground font-medium block">best wpm</span>
              <span className="text-xl font-bold text-primary">{bestWpm}</span>
            </div>
            <div className="bg-background p-3 rounded-xl border border-white/10 text-center font-mono">
              <span className="text-[10px] uppercase text-muted-foreground font-medium block">avg wpm</span>
              <span className="text-xl font-bold text-foreground">{avgWpm}</span>
            </div>
            <div className="bg-background p-3 rounded-xl border border-white/10 text-center font-mono">
              <span className="text-[10px] uppercase text-muted-foreground font-medium block">avg acc</span>
              <span className="text-xl font-bold text-foreground">{avgAcc}%</span>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-sm space-y-2 font-mono">
              <History className="w-10 h-10 opacity-30" />
              <p>No test history yet. Complete a typing test to save your stats!</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-background/60 hover:bg-background border border-white/10 p-3.5 rounded-xl transition-all flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-primary">{item.wpm} WPM</span>
                    {item.wpm === bestWpm && bestWpm > 0 && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded-md font-mono font-medium">
                        <Trophy className="w-3 h-3" /> PB
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px] mt-1">
                    <span>{item.accuracy}% acc</span>
                    <span>•</span>
                    <span>{item.modeValue}</span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={clearHistory}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-semibold font-mono rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Scores & History</span>
          </button>
        </div>
      </div>
    </div>
  )
}
