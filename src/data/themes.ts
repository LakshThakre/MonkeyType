import type { ThemeId } from "@/types/typing"

export interface ThemeConfig {
  id: ThemeId
  name: string
  bg: string
  main: string
  sub: string
  text: string
  isDark: boolean
}

export const THEMES: ThemeConfig[] = [
  {
    id: "mono-dark",
    name: "Dark Mode",
    bg: "#111111",
    main: "#ffffff",
    sub: "#777777",
    text: "#ffffff",
    isDark: true
  },
  {
    id: "mono-light",
    name: "Light Mode",
    bg: "#ffffff",
    main: "#111111",
    sub: "#888888",
    text: "#111111",
    isDark: false
  }
]
