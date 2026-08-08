export type TestMode = "time" | "words" | "quote"

export type TimeOption = 15 | 30 | 60 | 120
export type WordOption = 10 | 25 | 50 | 100

export type ThemeId = "mono-dark" | "mono-light"

export interface TestSettings {
  mode: TestMode
  time: TimeOption
  wordsCount: WordOption
  includePunctuation: boolean
  includeNumbers: boolean
  soundEnabled: boolean
  theme: ThemeId
}

export type CharStatus = "untyped" | "correct" | "incorrect" | "extra"

export interface CharState {
  char: string
  status: CharStatus
}

export interface WordState {
  original: string
  typed: string
  chars: CharState[]
  hasError: boolean
}

export interface WpmDataPoint {
  second: number
  wpm: number
  rawWpm: number
  errors: number
}

export interface CharBreakdown {
  correct: number
  incorrect: number
  extra: number
  missed: number
}

export interface TestResult {
  id: string
  timestamp: number
  mode: TestMode
  modeValue: number | string
  wpm: number
  rawWpm: number
  accuracy: number
  consistency: number
  charStats: CharBreakdown
  chartData: WpmDataPoint[]
  theme: ThemeId
  isPersonalBest?: boolean
  elapsedSeconds: number
  totalKeystrokes: number
  errorSeconds: number[]
}

export interface QuoteItem {
  id: number
  text: string
  author: string
}
