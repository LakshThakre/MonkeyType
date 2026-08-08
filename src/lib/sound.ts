// Web Audio API Synthesizer for typing sounds
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume()
  }
  return audioCtx
}

export function playKeySound(type: "click" | "backspace" | "error" | "finish" = "click") {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === "click") {
      // Crisp, louder mechanical keypress click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(500 + Math.random() * 150, now)
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035)

      // Increased volume from 0.12 to 0.45
      gain.gain.setValueAtTime(0.45, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.045)

      // Louder tactile noise snap
      const bufferSize = ctx.sampleRate * 0.02
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      const noiseGain = ctx.createGain()

      // Increased noise volume from 0.04 to 0.15
      noiseGain.gain.setValueAtTime(0.15, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

      whiteNoise.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      whiteNoise.start(now)
      whiteNoise.stop(now + 0.02)
    } else if (type === "backspace") {
      // Deeper, louder backspace click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.045)

      // Increased volume to 0.4
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.05)
    } else if (type === "error") {
      // Distinct, louder error thud
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(160, now)
      osc.frequency.linearRampToValueAtTime(100, now + 0.07)

      // Increased volume to 0.45
      gain.gain.setValueAtTime(0.45, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === "finish") {
      // Loud victory chord
      const freqs = [523.25, 659.25, 783.99, 1046.50]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const noteTime = now + idx * 0.06

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, noteTime)

        gain.gain.setValueAtTime(0.35, noteTime)
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(noteTime)
        osc.stop(noteTime + 0.5)
      })
    }
  } catch (e) {
    // Ignore audio context errors gracefully
  }
}
