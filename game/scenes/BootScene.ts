import Phaser from 'phaser'
import { TW, TH } from '../constants'

/** How far a wall block visually rises above the floor diamond. */
const BLOCK_H = 28
/** Cool neon used for the arena, floor grid and indestructible walls. */
const NEON_COOL = 0x4fc3f7
/** Warm neon that marks destructible "energy crates". */
const NEON_WARM = 0xffb74d

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
    // Dark grid floor — two cool shades so the playfield reads as a tech grid
    this.buildFloor('tile-floor',   0x102a44, 0x3f86c2)
    this.buildFloor('tile-floor-2', 0x0c2238, 0x336ea8)

    // Indestructible wall — dark metal with cool neon edges
    this.buildWall('tile-hard', {
      top: 0x1d3a54, left: 0x102434, right: 0x0a1825,
      neon: NEON_COOL, frame: 0x06101a, style: 'metal',
    })
    // Destructible wall — dark "energy crate" ringed in warm neon
    this.buildWall('tile-soft', {
      top: 0x3a2a14, left: 0x281b0d, right: 0x1c1207,
      neon: NEON_WARM, frame: 0x140d05, style: 'crate',
    })

    this.buildUnit()
    this.buildUnitFace()
    this.buildShadow()
    this.buildBomb()
    this.buildItem()
    this.buildBackdrop()

    this.scene.start('Game')
  }

  /** A dark iso floor tile with a glowing neon grid edge. */
  private buildFloor(key: string, base: number, line: number) {
    const g = this.make.graphics({ x: 0, y: 0 })
    // recessed grout
    g.fillStyle(0x060c15, 1)
    g.fillPoints(diamond(TW / 2, TH / 2, TW, TH), true)
    // dark inset panel
    g.fillStyle(base, 1)
    g.fillPoints(diamond(TW / 2, TH / 2, TW - 4, TH - 3), true)
    // cool sheen across the upper half
    g.fillStyle(line, 0.12)
    g.fillPoints([
      { x: TW / 2, y: 2 },
      { x: TW - 4, y: TH / 2 },
      { x: TW / 2, y: TH / 2 },
      { x: 4, y: TH / 2 },
    ], true)
    // neon grid outline
    g.lineStyle(1.2, line, 0.5)
    g.strokePoints(diamond(TW / 2, TH / 2, TW - 4, TH - 3), true, true)
    g.generateTexture(key, TW, TH)
    g.destroy()
  }

  /** An isometric cube: shaded faces rising BLOCK_H, ringed in neon along the lit edges. */
  private buildWall(
    key: string,
    c: { top: number; left: number; right: number; neon: number; frame: number; style: 'metal' | 'crate' },
  ) {
    const H = BLOCK_H
    const texH = TH + H
    const g = this.make.graphics({ x: 0, y: 0 })

    const top   = diamond(TW / 2, TH / 2, TW, TH)
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
    // glow pooled on the top face
    g.fillStyle(c.neon, 0.12)
    g.fillPoints(diamond(TW / 2, TH / 2, TW - 12, TH - 7), true)

    if (c.style === 'crate') {
      // horizontal energy band across both side faces
      g.lineStyle(1.5, c.neon, 0.45)
      g.beginPath(); g.moveTo(0, TH / 2 + H / 2); g.lineTo(TW / 2, TH + H / 2); g.strokePath()
      g.beginPath(); g.moveTo(TW, TH / 2 + H / 2); g.lineTo(TW / 2, TH + H / 2); g.strokePath()
    } else {
      // metal rivets at the face corners
      g.fillStyle(0xcdd9e3, 0.45)
      for (const [rx, ry] of [[8, 24], [8, 24 + H - 8], [TW - 8, 24], [TW - 8, 24 + H - 8]] as const)
        g.fillCircle(rx, ry, 1.6)
    }

    // dark structural outline on the side faces
    g.lineStyle(1.5, c.frame, 1)
    g.strokePoints(left, true, true)
    g.strokePoints(right, true, true)
    // neon along the top rim + the lit front vertical edge
    g.lineStyle(2, c.neon, 0.85)
    g.strokePoints(top, true, true)
    g.beginPath(); g.moveTo(TW / 2, TH); g.lineTo(TW / 2, TH + H); g.strokePath()
    // glow nodes where the front edge meets top and base
    g.fillStyle(c.neon, 0.95)
    g.fillCircle(TW / 2, TH, 2)
    g.fillCircle(TW / 2, TH + H, 2)

    g.generateTexture(key, TW, texH)
    g.destroy()
  }

  /**
   * Player/enemy token: a little neon mech (helmet + visor + body + feet).
   * The body is light-grey so a runtime tint paints it the team colour, while
   * the visor is pure white so the same tint makes it the brightest, glowing part.
   */
  private buildUnit() {
    const W = 56, H = 64, cx = 28
    const g = this.make.graphics({ x: 0, y: 0 })

    const body: Vec[] = [
      { x: 15, y: 36 }, { x: 41, y: 36 },
      { x: 45, y: 57 }, { x: 11, y: 57 },
    ]

    // feet
    g.fillStyle(0xb8c6d6, 1)
    g.fillEllipse(20, 60, 13, 7)
    g.fillEllipse(36, 60, 13, 7)
    // torso
    g.fillStyle(0xd2dfec, 1)
    g.fillPoints(body, true)
    // chest plate
    g.fillStyle(0xc2d0e0, 1)
    g.fillRoundedRect(19, 39, 18, 12, 4)
    // helmet dome
    g.fillStyle(0xdce8f5, 1)
    g.fillCircle(cx, 22, 17)
    // visor (brightest -> glows after tint)
    g.fillStyle(0xffffff, 1)
    g.fillRoundedRect(cx - 13, 17, 26, 10, 5)

    // dark outlines (barely affected by tint, so they stay as crisp ink lines)
    g.lineStyle(2.5, 0x0a121d, 1)
    g.strokeCircle(cx, 22, 17)
    g.strokePoints(body, true, true)
    g.lineStyle(2, 0x0a121d, 0.9)
    g.strokeRoundedRect(cx - 13, 17, 26, 10, 5)

    g.generateTexture('player', W, H)
    g.destroy()
  }

  /** Always-white visor glow — overlaid on the unit, never tinted, so the
   *  "face" reads as a lit screen regardless of the team colour underneath. */
  private buildUnitFace() {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff, 0.30); g.fillRoundedRect(2, 1.5, 24, 8, 3.5)  // soft screen glow
    g.fillStyle(0xffffff, 0.95); g.fillRoundedRect(4, 2.5, 20, 2, 1)    // top reflection streak
    g.fillStyle(0xffffff, 1)
    g.fillCircle(10, 6, 2.1)                                            // eye glints
    g.fillCircle(18, 6, 2.1)
    g.generateTexture('player-face', 28, 12)
    g.destroy()
  }

  private buildShadow() {
    const sh = this.make.graphics({ x: 0, y: 0 })
    sh.fillStyle(0x000000, 0.35); sh.fillEllipse(28, 8, 44, 14)
    sh.generateTexture('shadow', 56, 16)
    sh.destroy()
  }

  /** Classic round bomb: dark sphere, neon halo, highlight, fuse cap and spark. */
  private buildBomb() {
    const b = this.make.graphics({ x: 0, y: 0 })
    b.fillStyle(NEON_COOL, 0.08); b.fillCircle(18, 26, 17)  // halo
    b.fillStyle(0x05070d, 1);  b.fillCircle(18, 26, 14)     // body
    b.fillStyle(0x222838, 1);  b.fillCircle(18, 26, 12)
    b.fillStyle(0x46506b, 0.9); b.fillCircle(13, 21, 4)     // highlight
    b.fillStyle(0xffffff, 0.8); b.fillCircle(12, 20, 2)
    b.fillStyle(0x2c3242, 1);  b.fillRect(15, 9, 6, 6)      // fuse cap
    b.lineStyle(2, 0xc9a36b, 1); b.beginPath(); b.moveTo(18, 9); b.lineTo(25, 3); b.strokePath()
    b.fillStyle(0xffca28, 1);  b.fillCircle(26, 2, 2.6)     // spark
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
