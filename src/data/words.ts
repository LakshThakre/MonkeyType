import type { QuoteItem } from "@/types/typing"

export const COMMON_WORDS: string[] = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
  "that", "for", "they", "i", "with", "as", "not", "on", "she", "at",
  "by", "this", "we", "you", "do", "but", "from", "or", "which", "one",
  "would", "all", "will", "there", "say", "who", "make", "when", "can", "more",
  "if", "no", "man", "out", "other", "so", "what", "time", "up", "go",
  "about", "than", "into", "could", "state", "only", "new", "year", "some", "take",
  "come", "these", "know", "see", "use", "get", "like", "then", "first", "any",
  "work", "now", "may", "such", "give", "over", "think", "most", "even", "find",
  "day", "also", "after", "way", "many", "must", "look", "before", "great", "back",
  "through", "long", "where", "much", "should", "well", "people", "down", "own", "just",
  "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place",
  "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write",
  "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop",
  "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another",
  "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point",
  "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home",
  "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without",
  "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem",
  "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face",
  "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line",
  "city", "system", "force", "power", "nature", "light", "voice", "build", "mind", "level",
  "clear", "ground", "idea", "sense", "truth", "space", "order", "reach", "class", "cause",
  "story", "create", "value", "action", "force", "model", "matter", "market", "policy", "reason",
  "effort", "effect", "strong", "simple", "result", "future", "nature", "target", "source",
  "code", "data", "screen", "pulse", "stream", "buffer", "matrix", "vector", "signal", "array",
  "logic", "script", "object", "thread", "packet", "socket", "kernel", "server", "client", "render"
]

export const QUOTES: QuoteItem[] = [
  {
    id: 1,
    text: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra"
  },
  {
    id: 2,
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson"
  },
  {
    id: 3,
    text: "Make it work, make it right, make it fast.",
    author: "Kent Beck"
  },
  {
    id: 4,
    text: "Knowledge is power, but enthusiasm pulls the switch.",
    author: "Ivern Ball"
  },
  {
    id: 5,
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso"
  },
  {
    id: 6,
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss"
  },
  {
    id: 7,
    text: "Code is like humor. When you have to explain it, it is bad.",
    author: "Cory House"
  },
  {
    id: 8,
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  }
]

const PUNCTUATIONS = [".", ",", "!", "?", ";", ":"]
const NUMBERS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "42", "100", "2026"]

export function generateWordList(
  count: number,
  includePunctuation: boolean = false,
  includeNumbers: boolean = false
): string[] {
  const result: string[] = []

  for (let i = 0; i < count; i++) {
    const isNumber = includeNumbers && Math.random() < 0.15
    let word = ""

    if (isNumber) {
      word = NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    } else {
      const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length)
      word = COMMON_WORDS[randomIndex]
    }

    if (includePunctuation && !isNumber && Math.random() < 0.25) {
      const punc = PUNCTUATIONS[Math.floor(Math.random() * PUNCTUATIONS.length)]
      const isCapital = Math.random() < 0.4
      if (isCapital) {
        word = word.charAt(0).toUpperCase() + word.slice(1)
      }
      word += punc
    }

    result.push(word)
  }

  return result
}

export function getRandomQuote(): QuoteItem {
  const index = Math.floor(Math.random() * QUOTES.length)
  return QUOTES[index]
}
