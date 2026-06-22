import Phaser from 'phaser'
import { toScreen, TH } from '../constants'
import { TileMap } from './TileMap'

export class PlayerSprite {
  private shadow: Phaser.GameObjects.Image
  private img: Phaser.GameObjects.Image
  private gloss: Phaser.GameObjects.Image
  private label: Phaser.GameObjects.Text
  private jumpZ = 0

  constructor(scene: Phaser.Scene, public id: string, tx: number, ty: number,
    color: number, username: string, map: TileMap) {
    const { x, y } = toScreen(tx, ty)
    this.shadow = scene.add.image(x, y - 4, 'shadow').setAlpha(0.5)
    this.img = scene.add.image(x, y - 24, 'player').setTint(color)
    this.gloss = scene.add.image(x - 5, y - 30, 'player-gloss')
    this.label = scene.add.text(x, y - 54, username, {
      fontFamily: 'system-ui, "Microsoft YaHei", sans-serif',
      fontSize: '11px', color: '#eaf6ff', stroke: '#0b1022', strokeThickness: 3,
    }).setOrigin(0.5, 1)
    this.setDepth(map.getDepth(tx, ty) + 2)
  }

  update(tx: number, ty: number, hp: number, maxHp: number, _jumpZ = 0) {
    const { x, y } = toScreen(tx, ty)
    this.jumpZ = _jumpZ
    const jy = _jumpZ * TH
    this.shadow.setPosition(x, y - 4).setAlpha(0.5 - _jumpZ * 0.15)
    this.img.setPosition(x, y - 24 - jy)
    this.gloss.setPosition(x - 5, y - 30 - jy)
    this.label.setPosition(x, y - 54 - jy)
    const pct = hp / maxHp
    this.img.setTint(pct > 0.5 ? 0xffffff : pct > 0.25 ? 0xffcc00 : 0xff4444)
  }

  die() { this.img.setAlpha(0.3); this.gloss.setAlpha(0); this.shadow.setAlpha(0) }

  setDepth(d: number) {
    this.shadow.setDepth(d); this.img.setDepth(d + 1); this.gloss.setDepth(d + 2); this.label.setDepth(d + 3)
  }

  destroy() { this.shadow.destroy(); this.img.destroy(); this.gloss.destroy(); this.label.destroy() }
}
