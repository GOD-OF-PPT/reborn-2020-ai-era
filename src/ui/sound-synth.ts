const SOUND_STORAGE_KEY = 'reborn-2020-sound-enabled'

let sharedContext: AudioContext | null = null

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
    return localStorage.getItem(SOUND_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setSoundEnabled(enabled: boolean): boolean {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false')
    if (enabled) playConfirmTap(true)
    return true
  } catch {
    return false
  }
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
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.065)
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
  const notes = [659.25, 880, 1046.5]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + idx * 0.055)
    gain.gain.setValueAtTime(0.065, now + idx * 0.055)
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + idx * 0.055)
    osc.stop(now + idx * 0.055 + 0.24)
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
  osc.frequency.setValueAtTime(290, now)
  osc.frequency.exponentialRampToValueAtTime(190, now + 0.05)
  gain.gain.setValueAtTime(0.04, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.06)
}
