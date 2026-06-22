import Phaser from 'phaser'
import { toScreen, TH } from '../constants'
import { TileMap } from './TileMap'

export class PlayerSprite {
  private shadow: Phaser.GameObjects.Image
  private img: Phaser.GameObjects.Image
  private face: Phaser.GameObjects.Image
  private label: Phaser.GameObjects.Text
  private baseColor: number

  constructor(scene: Phaser.Scene, public id: string, tx: number, ty: number,
    color: number, username: string, map: TileMap) {
    const { x, y } = toScreen(tx, ty)
    this.baseColor = color
    this.shadow = scene.add.image(x, y - 2, 'shadow').setAlpha(0.5)
    this.img = scene.add.image(x, y + 2, 'player').setOrigin(0.5, 1).setTint(color)
    this.face = scene.add.image(x, y - 40, 'player-face')
    this.label = scene.add.text(x, y - 60, username, {
      fontFamily: 'system-ui, "Microsoft YaHei", sans-serif',
      fontSize: '11px', color: '#eaf6ff', stroke: '#0b1022', strokeThickness: 3,
    }).setOrigin(0.5, 1)
    this.setDepth(map.getDepth(tx, ty) + 2)
  }

  update(tx: number, ty: number, _hp: number, _maxHp: number, _jumpZ = 0) {
    const { x, y } = toScreen(tx, ty)
    const jy = _jumpZ * TH
    this.shadow.setPosition(x, y - 2).setAlpha(0.5 - _jumpZ * 0.15)
    this.img.setPosition(x, y + 2 - jy)
    this.face.setPosition(x, y - 40 - jy)
    this.label.setPosition(x, y - 60 - jy)
    // Keep the team colour at all times so player vs. enemy stays readable;
    // health is conveyed by the HP bar, not by recolouring the unit.
    this.img.setTint(this.baseColor)
  }

  die() { this.img.setAlpha(0.3); this.face.setAlpha(0); this.shadow.setAlpha(0) }

  setDepth(d: number) {
    this.shadow.setDepth(d); this.img.setDepth(d + 1); this.face.setDepth(d + 2); this.label.setDepth(d + 3)
  }

  destroy() { this.shadow.destroy(); this.img.destroy(); this.face.destroy(); this.label.destroy() }
}
