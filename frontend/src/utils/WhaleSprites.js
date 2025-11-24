/**
 * WhaleSprites - 2D Grid Sprite Sheet Loader
 *
 * Manages loading and metadata for whale sprite animations.
 * Each tier has a 2D grid layout (바둑판 형식) with different configurations.
 */

/**
 * Sprite metadata for each tier
 * - frames: Total number of animation frames
 * - columns: Number of columns in the grid
 * - rows: Calculated automatically (Math.ceil(frames / columns))
 */
const SPRITE_METADATA = {
  1: { frames: 8, columns: 3 },  // 3x3 grid (1 empty cell)
  2: { frames: 8, columns: 3 },  // 3x3 grid (1 empty cell)
  3: { frames: 4, columns: 2 },  // 2x2 grid
  4: { frames: 8, columns: 3 },  // 3x3 grid (1 empty cell)
  5: { frames: 8, columns: 3 },  // 3x3 grid (1 empty cell)
  6: { frames: 8, columns: 3 },  // 3x3 grid (1 empty cell)
  7: { frames: 8, columns: 3 }   // 3x3 grid (1 empty cell)
}

/**
 * Effect sprite metadata (birth/death animations)
 * - frames: Total number of animation frames
 * - columns: Number of columns in the grid
 * - rows: Calculated automatically
 */
const EFFECT_METADATA = {
  birth: { frames: 6, columns: 3 },  // 3x2 grid (6 frames)
  die: { frames: 6, columns: 3 }     // 3x2 grid (6 frames)
}

class WhaleSprites {
  constructor() {
    this.images = {}        // Loaded Image objects for whale tiers
    this.effects = {}       // Loaded Image objects for effects (birth/die)
    this.loaded = false
    this.loadPromise = null
  }

  /**
   * Load all whale sprite sheets
   * @returns {Promise} Resolves when all images are loaded
   */
  load() {
    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const loadPromises = []

      // Load whale tier sprites (tier1-tier7)
      for (let tier = 1; tier <= 7; tier++) {
        const img = new Image()
        const promise = new Promise((imgResolve, imgReject) => {
          img.onload = () => {
            console.log(`✅ Loaded whale sprite tier${tier}: ${img.width}×${img.height}`)
            imgResolve()
          }
          img.onerror = () => {
            console.error(`❌ Failed to load whale sprite tier${tier}`)
            imgReject(new Error(`Failed to load tier${tier}`))
          }
        })

        img.src = `/assets/whales/tier${tier}.png`
        this.images[tier] = img
        loadPromises.push(promise)
      }

      // Load effect sprites (birth, die)
      const effects = ['birth', 'die']
      effects.forEach(effectName => {
        const img = new Image()
        const promise = new Promise((imgResolve, imgReject) => {
          img.onload = () => {
            console.log(`✅ Loaded effect sprite ${effectName}: ${img.width}×${img.height}`)
            imgResolve()
          }
          img.onerror = () => {
            console.error(`❌ Failed to load effect sprite ${effectName}`)
            imgReject(new Error(`Failed to load ${effectName}`))
          }
        })

        img.src = `/assets/whales/${effectName}.png`
        this.effects[effectName] = img
        loadPromises.push(promise)
      })

      Promise.all(loadPromises)
        .then(() => {
          this.loaded = true
          console.log('✅ All whale sprites and effects loaded successfully')
          resolve()
        })
        .catch((error) => {
          console.error('❌ Failed to load whale sprites:', error)
          reject(error)
        })
    })

    return this.loadPromise
  }

  /**
   * Get sprite metadata for a tier
   * @param {number} tier - Tier number (1-7)
   * @returns {object} Metadata with frames, columns, rows
   */
  getMetadata(tier) {
    const meta = SPRITE_METADATA[tier]
    if (!meta) {
      console.warn(`Unknown tier ${tier}, using tier 3 as fallback`)
      return { ...SPRITE_METADATA[3], rows: Math.ceil(SPRITE_METADATA[3].frames / SPRITE_METADATA[3].columns) }
    }

    return {
      ...meta,
      rows: Math.ceil(meta.frames / meta.columns)
    }
  }

  /**
   * Get Image object for a tier
   * @param {number} tier - Tier number (1-7)
   * @returns {Image} HTMLImageElement
   */
  getImage(tier) {
    return this.images[tier] || this.images[3]  // Fallback to tier 3
  }

  /**
   * Calculate frame position in 2D grid
   * @param {number} tier - Tier number (1-7)
   * @param {number} frameIndex - Current frame index (0-based)
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @returns {object} {sx, sy, sw, sh} - Source rectangle for drawImage
   */
  getFrameRect(tier, frameIndex, frameWidth, frameHeight) {
    const meta = this.getMetadata(tier)

    // Ensure frame index is within valid range
    const validFrameIndex = frameIndex % meta.frames

    // Calculate 2D grid position
    const col = validFrameIndex % meta.columns
    const row = Math.floor(validFrameIndex / meta.columns)

    return {
      sx: col * frameWidth,
      sy: row * frameHeight,
      sw: frameWidth,
      sh: frameHeight
    }
  }

  /**
   * Get effect metadata (birth/die animations)
   * @param {string} effectName - Effect name ('birth' or 'die')
   * @returns {object} Metadata with frames, columns, rows
   */
  getEffectMetadata(effectName) {
    const meta = EFFECT_METADATA[effectName]
    if (!meta) {
      console.warn(`Unknown effect ${effectName}, using 'birth' as fallback`)
      return { ...EFFECT_METADATA.birth, rows: Math.ceil(EFFECT_METADATA.birth.frames / EFFECT_METADATA.birth.columns) }
    }

    return {
      ...meta,
      rows: Math.ceil(meta.frames / meta.columns)
    }
  }

  /**
   * Get Image object for an effect
   * @param {string} effectName - Effect name ('birth' or 'die')
   * @returns {Image} HTMLImageElement
   */
  getEffectImage(effectName) {
    return this.effects[effectName] || this.effects['birth']  // Fallback to birth
  }

  /**
   * Calculate frame position for effect sprite
   * @param {string} effectName - Effect name ('birth' or 'die')
   * @param {number} frameIndex - Current frame index (0-based)
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @returns {object} {sx, sy, sw, sh} - Source rectangle for drawImage
   */
  getEffectFrameRect(effectName, frameIndex, frameWidth, frameHeight) {
    const meta = this.getEffectMetadata(effectName)

    // Ensure frame index is within valid range
    const validFrameIndex = frameIndex % meta.frames

    // Calculate 2D grid position
    const col = validFrameIndex % meta.columns
    const row = Math.floor(validFrameIndex / meta.columns)

    return {
      sx: col * frameWidth,
      sy: row * frameHeight,
      sw: frameWidth,
      sh: frameHeight
    }
  }

  /**
   * Check if sprites are loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded
  }
}

// Export singleton instance
const whaleSprites = new WhaleSprites()
export default whaleSprites
