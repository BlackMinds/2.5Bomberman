import Phaser from 'phaser'
import { TW, TH } from '../constants'

/** Vertices of a `spikes`-point star centred at (cx, cy). Replaces the
 *  non-existent Graphics.fillStar so the item texture can be generated. */
function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number) {
  const pts: Phaser.Types.Math.Vector2Like[] = []
  const step = Math.PI / spikes
  let rot = -Math.PI / 2
  for (let i = 0; i < spikes; i++) {
    pts.push({ x: cx + Math.cos(rot) * outer, y: cy + Math.sin(rot) * outer }); rot += step
    pts.push({ x: cx + Math.cos(rot) * inner, y: cy + Math.sin(rot) * inner }); rot += step
  }
  return pts
}

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }

  create() {
    // Floor tile
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0x4a7c59); g.fillRect(0, 0, TW, TH / 2)
    g.strokeRect(0, 0, TW, TH / 2)
    g.generateTexture('tile-floor', TW, TH / 2); g.destroy()

    // Hard wall
    const hw = this.make.graphics({ x: 0, y: 0 })
    hw.fillStyle(0x78909c); hw.fillRect(0, 0, TW, TH)
    hw.generateTexture('tile-hard', TW, TH); hw.destroy()

    // Soft wall
    const sw = this.make.graphics({ x: 0, y: 0 })
    sw.fillStyle(0xa0522d); sw.fillRect(0, 0, TW, TH)
    sw.generateTexture('tile-soft', TW, TH); sw.destroy()

    // Player (48x48 circle)
    const p = this.make.graphics({ x: 0, y: 0 })
    p.fillStyle(0xffffff); p.fillCircle(24, 24, 20)
    p.generateTexture('player', 48, 48); p.destroy()

    // Shadow
    const sh = this.make.graphics({ x: 0, y: 0 })
    sh.fillStyle(0x000000, 0.35); sh.fillEllipse(24, 8, 36, 10)
    sh.generateTexture('shadow', 48, 16); sh.destroy()

    // Bomb
    const b = this.make.graphics({ x: 0, y: 0 })
    b.fillStyle(0x212121); b.fillCircle(16, 16, 14)
    b.generateTexture('bomb', 32, 32); b.destroy()

    // Item (5-point star — Phaser Graphics has no fillStar, build the points manually)
    const it = this.make.graphics({ x: 0, y: 0 })
    it.fillStyle(0xffeb3b); it.fillPoints(starPoints(12, 12, 5, 10, 5), true)
    it.generateTexture('item', 24, 24); it.destroy()

    this.scene.start('Game')
  }
}
