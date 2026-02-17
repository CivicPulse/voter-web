/**
 * Plays a short two-note notification chime using the Web Audio API.
 * No external audio file is required — the tone is synthesized on the fly.
 *
 * The AudioContext is lazily created on first call and reused afterwards.
 * Browsers require a prior user gesture before audio can play; if the
 * context is in a "suspended" state we attempt to resume it and silently
 * skip playback if that fails.
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

/**
 * Play a short two-note notification chime.
 *
 * The chime is two quick sine-wave tones (E5 → G5) at low volume so it's
 * noticeable but not jarring.
 */
export async function playNotificationSound(): Promise<void> {
  const ctx = getAudioContext()

  // Browsers block audio until the user has interacted with the page.
  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
    } catch {
      return // Can't play yet — silently skip.
    }
  }

  const now = ctx.currentTime
  const volume = 0.15
  const notes: Array<{ freq: number; start: number; duration: number }> = [
    { freq: 659.25, start: now, duration: 0.12 }, // E5
    { freq: 783.99, start: now + 0.14, duration: 0.16 }, // G5
  ]

  for (const { freq, start, duration } of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = freq

    // Fade in / out to avoid clicks
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + 0.01)
    gain.gain.linearRampToValueAtTime(0, start + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(start)
    osc.stop(start + duration)
  }
}
