/**
 * Plays a notification chime from a static WAV file.
 *
 * The Audio element is lazily created on first call and reused afterwards.
 * Each call resets playback to the start so rapid successive calls don't
 * queue up multiple overlapping plays.
 */

let audio: HTMLAudioElement | null = null

export async function playNotificationSound(): Promise<void> {
  try {
    if (!audio) {
      audio = new Audio("/sounds/notification-chime.wav")
      audio.volume = 0.4
    }

    // Reset to start so we can re-trigger even if already playing.
    audio.currentTime = 0
    await audio.play()
  } catch {
    // Browsers block audio until user interaction — silently skip.
  }
}
