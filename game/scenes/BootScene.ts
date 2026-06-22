import Phaser from 'phaser'
import { TW, TH } from '../constants'

/** How far a wall block visually rises above the floor diamond. */
const BLOCK_H = 28

type Vec = Phaser.Types.Math.Vector2Like

/** Points of a 2:1 isometric diamond centred at (cx, cy). */
function diamond(cx: number, cy: number, w: number, h: number): Vec[] {
  return [
    { x: cx,         y: cy - h / 2 }, // top
    { x: cx + w / 2, y: cy },         // right
    { x: cx,         y: cy + h / 2 }, // bottom
    { x: cx - w / 2, y: cy },         // left
  ]
}

/** Vertices of a `spikes`-point star centred at (cx, cy). */
function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number): Vec[] {
  const pts: Vec[] = []
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
    // Checkerboard floor — two shades for readability (classic Bomberman grid)
    this.buildFloor('tile-floor',   0x4f8a63, 0x2f5a3e)
    this.buildFloor('tile-floor-2', 0x59986e, 0x35643f)

    // Indestructible wall — cool metal/stone
    this.buildWall('tile-hard', { top: 0x9aa7b2, left: 0x66747f, right: 0x53616b, line: 0x33404a, style: 'metal' })
    // Destructible wall — warm wooden crate
    this.buildWall('tile-soft', { top: 0xc89a5a, left: 0x9c6f39, right: 0x80592c, line: 0x573a1b, style: 'crate' })

    this.buildPlayer()
    this.buildGloss()
    this.buildShadow()
    this.buildBomb()
    this.buildItem()
    this.buildBackdrop()

    this.scene.start('Game')
  }

  /** A flat iso floor tile: darker grout border with a lighter inset. */
  private buildFloor(key: string, fill: number, edge: number) {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(edge, 1)
    g.fillPoints(diamond(TW / 2, TH / 2, TW, TH), true)
    g.fillStyle(fill, 1)
    g.fillPoints(diamond(TW / 2, TH / 2, TW - 6, TH - 4), true)
    // faint top sheen
    g.fillStyle(0xffffff, 0.05)
    g.fillPoints([
      { x: TW / 2, y: 2 },
      { x: TW - 4, y: TH / 2 },
      { x: TW / 2, y: TH / 2 },
      { x: 4, y: TH / 2 },
    ], true)
    g.generateTexture(key, TW, TH)
    g.destroy()
  }

  /** An isometric cube: shaded top + left + right faces, rising BLOCK_H above the floor. */
  private buildWall(
    key: string,
    c: { top: number; left: number; right: number; line: number; style: 'metal' | 'crate' },
  ) {
    const H = BLOCK_H
    const texH = TH + H
    const g = this.make.graphics({ x: 0, y: 0 })

    const top   = diamond(TW / 2, TH / 2, TW, TH) // top face, centre (32,16)
    const left  = [
      { x: 0,      y: TH / 2 },
      { x: TW / 2, y: TH },
      { x: TW / 2, y: TH + H },
      { x: 0,      y: TH / 2 + H },
    ]
    const right = [
      { x: TW,     y: TH / 2 },
      { x: TW / 2, y: TH },
      { x: TW / 2, y: TH + H },
      { x: TW,     y: TH / 2 + H },
    ]

    // Faces (draw sides first, top last)
    g.fillStyle(c.left, 1);  g.fillPoints(left, true)
    g.fillStyle(c.right, 1); g.fillPoints(right, true)
    g.fillStyle(c.top, 1);   g.fillPoints(top, true)

    if (c.style === 'crate') {
      // wooden belt + vertical plank seam on each side face
      g.lineStyle(1.5, c.line, 0.7)
      g.beginPath(); g.moveTo(0, TH / 2 + H / 2); g.lineTo(TW / 2, TH + H / 2); g.strokePath()
      g.beginPath(); g.moveTo(TW, TH / 2 + H / 2); g.lineTo(TW / 2, TH + H / 2); g.strokePath()
      g.beginPath(); g.moveTo(TW / 4, TH * 0.75); g.lineTo(TW / 4, TH * 0.75 + H); g.strokePath()
      g.beginPath(); g.moveTo(TW * 0.75, TH * 0.75); g.lineTo(TW * 0.75, TH * 0.75 + H); g.strokePath()
    } else {
      // metal rivets at the face corners
      g.fillStyle(0xeceff1, 0.55)
      for (const [rx, ry] of [[8, 24], [8, 24 + H - 8], [TW - 8, 24], [TW - 8, 24 + H - 8]] as const)
        g.fillCircle(rx, ry, 1.6)
    }

    // crisp outlines
    g.lineStyle(1.5, c.line, 0.95)
    g.strokePoints(top, true, true)
    g.strokePoints(left, true, true)
    g.strokePoints(right, true, true)

    g.generateTexture(key, TW, texH)
    g.destroy()
  }

  /** Player token: a glossy bead with a dark rim and soft bottom shading (tinted at runtime). */
  private buildPlayer() {
    const p = this.make.graphics({ x: 0, y: 0 })
    p.fillStyle(0x0d1320, 1); p.fillCircle(24, 24, 21)   // rim (stays dark through tint)
    p.fillStyle(0xffffff, 1); p.fillCircle(24, 23, 18)   // body (takes tint)
    p.fillStyle(0x000000, 0.20); p.fillCircle(24, 28, 16) // bottom shading
    p.generateTexture('player', 48, 48)
    p.destroy()
  }

  /** Specular highlight overlaid on the bead — never tinted, so it stays white. */
  private buildGloss() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff, 0.85); g.fillEllipse(9, 7, 12, 9)
    g.fillStyle(0xffffff, 0.45); g.fillEllipse(9, 7, 18, 14)
    g.generateTexture('player-gloss', 20, 16)
    g.destroy()
  }

  private buildShadow() {
    const sh = this.make.graphics({ x: 0, y: 0 })
    sh.fillStyle(0x000000, 0.30); sh.fillEllipse(24, 8, 40, 13)
    sh.generateTexture('shadow', 48, 16)
    sh.destroy()
  }

  /** Classic round bomb: dark sphere, highlight, fuse cap and spark. */
  private buildBomb() {
    const b = this.make.graphics({ x: 0, y: 0 })
    b.fillStyle(0x05070d, 1);  b.fillCircle(18, 26, 14)   // body
    b.fillStyle(0x222838, 1);  b.fillCircle(18, 26, 12)
    b.fillStyle(0x46506b, 0.9); b.fillCircle(13, 21, 4)   // highlight
    b.fillStyle(0xffffff, 0.8); b.fillCircle(12, 20, 2)
    b.fillStyle(0x2c3242, 1);  b.fillRect(15, 9, 6, 6)    // fuse cap
    b.lineStyle(2, 0xc9a36b, 1); b.beginPath(); b.moveTo(18, 9); b.lineTo(25, 3); b.strokePath()
    b.fillStyle(0xffca28, 1);  b.fillCircle(26, 2, 2.6)   // spark
    b.fillStyle(0xfff59d, 1);  b.fillCircle(26, 2, 1.2)
    b.generateTexture('bomb', 36, 44)
    b.destroy()
  }

  /** Power-up star (kept for future item rendering). */
  private buildItem() {
    const it = this.make.graphics({ x: 0, y: 0 })
    it.fillStyle(0xffca28, 1); it.fillPoints(starPoints(12, 13, 5, 11, 5), true)
    it.fillStyle(0xfff59d, 1); it.fillPoints(starPoints(12, 13, 5, 5, 2.5), true)
    it.generateTexture('item', 24, 26)
    it.destroy()
  }

  /** Vertical gradient backdrop, built as stacked bands so it works on any renderer. */
  private buildBackdrop() {
    const g = this.make.graphics({ x: 0, y: 0 })
    const top = { r: 0x16, g: 0x1d, b: 0x36 }
    const bot = { r: 0x05, g: 0x07, b: 0x0f }
    const steps = 48
    const h = 600 / steps
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const r = Math.round(top.r + (bot.r - top.r) * t)
      const gg = Math.round(top.g + (bot.g - top.g) * t)
      const bb = Math.round(top.b + (bot.b - top.b) * t)
      g.fillStyle((r << 16) | (gg << 8) | bb, 1)
      g.fillRect(0, Math.floor(i * h), 16, Math.ceil(h) + 1)
    }
    g.generateTexture('bg-grad', 16, 600)
    g.destroy()
  }
}
