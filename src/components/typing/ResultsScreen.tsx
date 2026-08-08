import { useEffect, useMemo } from "react"
import type { TestResult, WpmDataPoint } from "@/types/typing"
import confetti from "canvas-confetti"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"
import {
  ArrowRight,
  RotateCcw,
  Trophy,
  Sparkles
} from "lucide-react"

interface ResultsScreenProps {
  result: TestResult
  onRestart: () => void
  onNextTest: () => void
}

// Custom dot renderer for error markers — small red × at seconds where errors occurred
const ErrorDot = (props: {
  cx?: number
  cy?: number
  payload?: WpmDataPoint
  errorSeconds?: number[]
}) => {
  const { cx, cy, payload, errorSeconds } = props
  if (!cx || !cy || !payload || !errorSeconds) return null
  if (!errorSeconds.includes(payload.second)) return null

  return (
    <text
      x={cx}
      y={cy - 10}
      textAnchor="middle"
      fill="var(--error-color)"
      fontSize={11}
      fontFamily="'JetBrains Mono', monospace"
      fontWeight={700}
    >
      ×
    </text>
  )
}

export const ResultsScreen = ({
  result,
  onRestart,
  onNextTest
}: ResultsScreenProps) => {
  useEffect(() => {
    if (result.isPersonalBest) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
      } catch (e) {
        // silently fail
      }
    }
  }, [result.isPersonalBest])

  // Compute AFK percentage (seconds with 0 new chars typed relative to total)
  const afkPercent = useMemo(() => {
    if (result.chartData.length < 2) return 0
    let idleSeconds = 0
    for (let i = 1; i < result.chartData.length; i++) {
      const prev = result.chartData[i - 1]
      const curr = result.chartData[i]
      if (curr.wpm === prev.wpm && curr.rawWpm === prev.rawWpm && curr.errors === 0) {
        idleSeconds++
      }
    }
    return Math.round((idleSeconds / result.chartData.length) * 10000) / 100
  }, [result.chartData])

  const sessionDuration = useMemo(() => {
    const totalSecs = result.elapsedSeconds
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }, [result.elapsedSeconds])

  // Mode description for the left column
  const modeLabel = result.mode === "time"
    ? `time ${result.modeValue}`.replace("s", "")
    : result.mode === "words"
      ? `words ${result.modeValue}`.replace(" words", "")
      : "quote"

  // Max errors for right y-axis scaling
  const maxErrors = useMemo(() => {
    const max = Math.max(...result.chartData.map((d) => d.errors), 1)
    return Math.max(max + 1, 2)
  }, [result.chartData])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 space-y-6 animate-in fade-in duration-500">
      {/* Personal Best Banner */}
      {result.isPersonalBest && (
        <div className="flex items-center justify-center gap-2 py-2 text-primary text-sm font-semibold animate-pulse">
          <Trophy className="w-4 h-4" />
          <span>new personal best</span>
          <Sparkles className="w-4 h-4" />
        </div>
      )}

      {/* ═══ Main Two-Column Layout ═══ */}
      <div className="flex gap-8 items-start">

        {/* ─── LEFT COLUMN: WPM + ACC + Test Type ─── */}
        <div className="flex-shrink-0 w-[120px] space-y-6 pt-2">
          {/* WPM */}
          <div>
            <span className="block text-xs font-mono text-sub lowercase tracking-wide">wpm</span>
            <span className="block text-[56px] font-mono font-bold text-primary leading-none tracking-tight">
              {result.wpm}
            </span>
          </div>

          {/* ACC */}
          <div>
            <span className="block text-xs font-mono text-sub lowercase tracking-wide">acc</span>
            <span className="block text-[56px] font-mono font-bold text-primary leading-none tracking-tight">
              {result.accuracy}%
            </span>
          </div>

          {/* Test Type */}
          <div className="pt-2 border-t border-gray-200">
            <span className="block text-[10px] font-mono text-sub lowercase tracking-wider">test type</span>
            <span className="block text-xs font-mono text-sub mt-1">{modeLabel}</span>
            <span className="block text-xs font-mono text-sub">english</span>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Chart ─── */}
        <div className="flex-1 min-w-0">
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={result.chartData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                  vertical={false}
                />

                {/* X axis — second elapsed */}
                <XAxis
                  dataKey="second"
                  stroke="var(--sub-color)"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  tickLine={false}
                  axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
                />

                {/* Left Y axis — Words per Minute */}
                <YAxis
                  yAxisId="wpm"
                  stroke="var(--sub-color)"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Words per Minute",
                    angle: -90,
                    position: "insideLeft",
                    offset: 20,
                    style: {
                      fill: "var(--sub-color)",
                      fontSize: 9,
                      fontFamily: "'JetBrains Mono', monospace"
                    }
                  }}
                />

                {/* Right Y axis — Errors */}
                <YAxis
                  yAxisId="errors"
                  orientation="right"
                  domain={[0, maxErrors]}
                  stroke="var(--sub-color)"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  label={{
                    value: "Errors",
                    angle: 90,
                    position: "insideRight",
                    offset: 20,
                    style: {
                      fill: "var(--sub-color)",
                      fontSize: 9,
                      fontFamily: "'JetBrains Mono', monospace"
                    }
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--sub-alt-color)",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    color: "var(--text-color)",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: "8px 12px"
                  }}
                  labelFormatter={(v) => `${v}s`}
                />

                {/* Raw WPM line — gray */}
                <Line
                  yAxisId="wpm"
                  type="monotone"
                  dataKey="rawWpm"
                  stroke="var(--sub-color)"
                  strokeWidth={1.5}
                  dot={{ r: 2.5, fill: "var(--sub-color)", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "var(--sub-color)" }}
                  name="raw"
                />

                {/* Net WPM line — main color */}
                <Line
                  yAxisId="wpm"
                  type="monotone"
                  dataKey="wpm"
                  stroke="var(--main-color)"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: "var(--main-color)", strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: "var(--main-color)" }}
                  name="wpm"
                />

                {/* Error markers — red × */}
                <Line
                  yAxisId="errors"
                  type="monotone"
                  dataKey="errors"
                  stroke="none"
                  dot={<ErrorDot errorSeconds={result.errorSeconds} />}
                  activeDot={false}
                  name="errors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Horizontal Stat Row Below Chart ═══ */}
      <div className="flex items-start justify-between border-t border-gray-200 pt-5 font-mono">
        {/* raw */}
        <div className="text-center flex-1">
          <span className="block text-[10px] text-sub lowercase tracking-wider">raw</span>
          <span className="block text-lg font-bold text-foreground mt-0.5">{result.rawWpm}</span>
        </div>

        {/* characters */}
        <div className="text-center flex-1">
          <span className="block text-[10px] text-sub lowercase tracking-wider">characters</span>
          <div className="flex items-center justify-center gap-0 mt-0.5">
            <span className="text-lg font-bold text-correct">{result.charStats.correct}</span>
            <span className="text-sm text-sub">/</span>
            <span className="text-lg font-bold text-error">{result.charStats.incorrect}</span>
            <span className="text-sm text-sub">/</span>
            <span className="text-lg font-bold text-error-extra">{result.charStats.extra}</span>
            <span className="text-sm text-sub">/</span>
            <span className="text-lg font-bold text-sub">{result.charStats.missed}</span>
          </div>
        </div>

        {/* consistency */}
        <div className="text-center flex-1">
          <span className="block text-[10px] text-sub lowercase tracking-wider">consistency</span>
          <span className="block text-lg font-bold text-foreground mt-0.5">{result.consistency}%</span>
        </div>

        {/* time */}
        <div className="text-center flex-1">
          <span className="block text-[10px] text-sub lowercase tracking-wider">time</span>
          <span className="block text-lg font-bold text-foreground mt-0.5">{result.elapsedSeconds}s</span>
          <span className="block text-[9px] text-sub mt-0.5">{afkPercent}% afk</span>
          <span className="block text-[9px] text-sub">{sessionDuration} session</span>
        </div>
      </div>

      {/* ═══ Action Buttons with Icon and Text ═══ */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-mono text-xs font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart Test</span>
        </button>

        <button
          onClick={onNextTest}
          className="flex items-center gap-2 px-5 py-2.5 bg-card border border-white/10 text-foreground font-mono text-xs font-semibold rounded-xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
        >
          <span>Next Test</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
