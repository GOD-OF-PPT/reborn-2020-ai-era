const SOUND_STORAGE_KEY = 'reborn-2020-sound-enabled'
const BGM_STORAGE_KEY = 'reborn-2020-bgm-enabled'

let sharedContext: AudioContext | null = null
let bgmInterval: ReturnType<typeof setInterval> | null = null
let chordStep = 0

const AMBIENT_CHORDS = [
  [174.61, 220.0, 261.63, 329.63],
  [164.81, 196.0, 246.94, 293.66],
  [146.83, 174.61, 220.0, 261.63],
  [130.81, 164.81, 196.0, 246.94],
]

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedContext) {
    try {
      sharedContext = new Ctor()
    } catch {
      return null
    }
  }
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume().catch(() => {})
  }
  return sharedContext
}

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function isBgmEnabled(): boolean {
  try {
    return localStorage.getItem(BGM_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function playAmbientChord(): void {
  if (!isSoundEnabled() || !isBgmEnabled()) return
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  const chord = AMBIENT_CHORDS[chordStep % AMBIENT_CHORDS.length]!
  chordStep += 1
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.06)
    gain.gain.setValueAtTime(0.0001, now + idx * 0.06)
    gain.gain.linearRampToValueAtTime(0.018, now + idx * 0.06 + 0.25)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + idx * 0.06)
    osc.stop(now + 2.6)
  })
}

export function startAmbientBgm(): void {
  if (typeof window === 'undefined') return
  if (bgmInterval) clearInterval(bgmInterval)
  if (!isSoundEnabled() || !isBgmEnabled()) return
  playAmbientChord()
  bgmInterval = setInterval(playAmbientChord, 2800)
}

export function setSoundEnabled(enabled: boolean): boolean {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false')
    localStorage.setItem(BGM_STORAGE_KEY, enabled ? 'true' : 'false')
    if (enabled) {
      playConfirmTap(true)
      startAmbientBgm()
    } else if (bgmInterval) {
      clearInterval(bgmInterval)
      bgmInterval = null
    }
    return true
  } catch {
    return false
  }
}

if (typeof window !== 'undefined') {
  const unlockOnce = () => {
    if (isSoundEnabled() && isBgmEnabled() && !bgmInterval) {
      startAmbientBgm()
    }
    window.removeEventListener('pointerdown', unlockOnce)
    window.removeEventListener('keydown', unlockOnce)
  }
  window.addEventListener('pointerdown', unlockOnce, { passive: true })
  window.addEventListener('keydown', unlockOnce, { passive: true })
}

export function playConfirmTap(force = false): void {
  if (!force && !isSoundEnabled()) return
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(520, now)
  osc.frequency.exponentialRampToValueAtTime(690, now + 0.065)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.08)
}

export function playCoinChime(): void {
  if (!isSoundEnabled()) return
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  const notes = [659.25, 880, 1046.5, 1318.5]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.055)
    gain.gain.setValueAtTime(0.065, now + idx * 0.055)
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.24)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + idx * 0.055)
    osc.stop(now + idx * 0.055 + 0.26)
  })
}

export function playPaperTurn(): void {
  if (!isSoundEnabled()) return
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(310, now)
  osc.frequency.exponentialRampToValueAtTime(195, now + 0.055)
  gain.gain.setValueAtTime(0.045, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.065)
}
