/**
 * SoundManager - Whale spawn sound effects manager
 * Handles audio playback for tier-based whale appearances
 */
class SoundManager {
  constructor() {
    // Audio pool for each tier (pre-loaded)
    this.sounds = {}

    // Settings
    this.volume = 0.5 // 50% default volume
    this.isMuted = false
    this.maxConcurrent = 3 // Max simultaneous sounds
    this.activeSounds = []

    // Sound aliases (2025-11-22: Alert system integration)
    this.soundAliases = {
      'alert-critical': 7, // S-tier alerts use T7 sound (most dramatic)
      'alert-high': 5, // A-tier alerts
      'alert-medium': 3 // B-tier alerts
    }

    // Load mute state from localStorage
    this.loadSettings()

    // Initialize sounds for all tiers (1-7)
    this.initializeSounds()
  }

  /**
   * Initialize audio objects for all tiers
   */
  initializeSounds() {
    for (let tier = 1; tier <= 7; tier++) {
      // 2025-11-19: Fixed sound path to match actual file location
      const audio = new Audio(`/sound/T${tier}_sound.mp3`)
      audio.volume = this.volume
      audio.preload = 'auto'

      // Cleanup when sound finishes
      audio.addEventListener('ended', () => {
        this.removeActiveSound(audio)
      })

      this.sounds[tier] = audio
    }

    console.log('🔊 SoundManager initialized with 7 tier sounds')
  }

  /**
   * Play sound for specific tier or alert type
   * @param {number|string} tierOrAlias - Whale tier (1-7) or alert alias ('alert-critical', 'alert-high', 'alert-medium')
   */
  play(tierOrAlias) {
    // Check if muted
    if (this.isMuted) {
      return
    }

    // Resolve alias to tier number (2025-11-22: Alert system support)
    let tier
    if (typeof tierOrAlias === 'string') {
      tier = this.soundAliases[tierOrAlias]
      if (!tier) {
        console.warn(`Unknown sound alias: ${tierOrAlias}`)
        return
      }
    } else {
      tier = tierOrAlias
    }

    // Validate tier
    if (tier < 1 || tier > 7) {
      console.warn(`Invalid tier: ${tier}`)
      return
    }

    // Limit concurrent sounds
    if (this.activeSounds.length >= this.maxConcurrent) {
      console.log('🔇 Max concurrent sounds reached, skipping')
      return
    }

    const sound = this.sounds[tier]

    // Clone audio for concurrent playback
    const clone = sound.cloneNode()
    clone.volume = this.volume

    // Add to active sounds
    this.activeSounds.push(clone)

    // Cleanup when finished
    clone.addEventListener('ended', () => {
      this.removeActiveSound(clone)
    })

    // Play sound
    clone.play().catch(err => {
      console.error('Sound playback failed:', err)
      this.removeActiveSound(clone)
    })

    const label = typeof tierOrAlias === 'string' ? tierOrAlias : `tier ${tier}`
    console.log(`🔊 Playing ${label} sound (${this.activeSounds.length} active)`)
  }

  /**
   * Remove sound from active list
   */
  removeActiveSound(sound) {
    const index = this.activeSounds.indexOf(sound)
    if (index > -1) {
      this.activeSounds.splice(index, 1)
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted
    this.saveSettings()

    // Stop all active sounds when muting
    if (this.isMuted) {
      this.stopAll()
    }

    console.log(`🔊 Sound ${this.isMuted ? 'muted' : 'unmuted'}`)
    return this.isMuted
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))

    // Update all loaded sounds
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume
    })

    this.saveSettings()
  }

  /**
   * Stop all active sounds
   */
  stopAll() {
    this.activeSounds.forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
    this.activeSounds = []
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('whale_sound_muted', JSON.stringify(this.isMuted))
      localStorage.setItem('whale_sound_volume', JSON.stringify(this.volume))
    } catch (err) {
      console.error('Failed to save sound settings:', err)
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const muted = localStorage.getItem('whale_sound_muted')
      const volume = localStorage.getItem('whale_sound_volume')

      if (muted !== null) {
        this.isMuted = JSON.parse(muted)
      }

      if (volume !== null) {
        this.volume = JSON.parse(volume)
      }
    } catch (err) {
      console.error('Failed to load sound settings:', err)
    }
  }

  /**
   * Get current mute state
   */
  getMuted() {
    return this.isMuted
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume
  }
}

// Export singleton instance
export default new SoundManager()
