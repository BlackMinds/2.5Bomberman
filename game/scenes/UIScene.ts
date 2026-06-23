import Phaser from 'phaser'
import { gameState, getSocketId } from '../network/GameClient'
import { watch } from 'vue'

const FONT = '"Segoe UI", system-ui, "Microsoft YaHei", sans-serif'

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text
  private enemyText!: Phaser.GameObjects.Text
  private hpBar!: Phaser.GameObjects.Graphics
  private hpText!: Phaser.GameObjects.Text
  private bannerBg!: Phaser.GameObjects.Graphics
  private bannerText!: Phaser.GameObjects.Text

  constructor() { super({ key: 'UI', active: false }) }

  create() {
    const W = this.scale.width

    // Top-centre timer panel
    const panel = this.add.graphics()
    panel.fillStyle(0x0b1022, 0.72); panel.fillRoundedRect(W / 2 - 78, 12, 156, 38, 12)
    panel.lineStyle(1.5, 0x4fc3f7, 0.5); panel.strokeRoundedRect(W / 2 - 78, 12, 156, 38, 12)
    this.timerText = this.add.text(W / 2, 31, '⏱ 0:00', {
      fontFamily: FONT, fontSize: '21px', color: '#eaf6ff',
    }).setOrigin(0.5)

    // Top-left HP
    this.add.text(16, 16, '生命', { fontFamily: FONT, fontSize: '13px', color: '#9fb3c8' })
    this.hpBar = this.add.graphics()
    this.hpText = this.add.text(150, 16, '', { fontFamily: FONT, fontSize: '13px', color: '#eaf6ff' })

    // Top-right enemies remaining
    this.enemyText = this.add.text(W - 16, 18, '', {
      fontFamily: FONT, fontSize: '16px', color: '#ff8a80',
    }).setOrigin(1, 0)

    // Centre banner (hidden until win/clear)
    this.bannerBg = this.add.graphics().setVisible(false)
    this.bannerText = this.add.text(W / 2, 286, '', {
      fontFamily: FONT, fontSize: '40px', color: '#ffffff',
      stroke: '#05070f', strokeThickness: 6, align: 'center',
    }).setOrigin(0.5).setVisible(false)

    watch(() => gameState.events, (evs) => {
      const last = evs[evs.length - 1]
      if (!last) return
      if (last.type === 'end') this.showBanner(last.winner === 'draw' ? '平 局' : '胜 利！', 0xffd54f)
      if (last.type === 'stageClear') this.showBanner('关卡通关 ✓', 0x69f0ae)
    }, { deep: true })
  }

  private showBanner(text: string, color: number) {
    const W = this.scale.width
    this.bannerBg.clear().setVisible(true)
    this.bannerBg.fillStyle(0x0b1022, 0.85); this.bannerBg.fillRoundedRect(W / 2 - 190, 248, 380, 78, 16)
    this.bannerBg.lineStyle(2, color, 0.85); this.bannerBg.strokeRoundedRect(W / 2 - 190, 248, 380, 78, 16)
    this.bannerText.setText(text).setVisible(true).setScale(0)
    this.tweens.add({ targets: this.bannerText, scale: 1, duration: 480, ease: 'Back.easeOut' })
  }

  override update() {
    const s = gameState.timeLeft
    const m = Math.floor(s / 60000), sec = Math.floor((s % 60000) / 1000)
    this.timerText.setText(`⏱ ${m}:${sec.toString().padStart(2, '0')}`)

    const me = gameState.players.find((p: any) => p.id === getSocketId())
    this.drawHp(me)

    const enemies = gameState.players.filter((p: any) => p.aiState && p.alive).length
    this.enemyText.setText(enemies ? `👾 敌人 ×${enemies}` : '')
  }

  private drawHp(me: any) {
    const g = this.hpBar
    const x = 52, y = 17, w = 92, h = 13
    g.clear()
    g.fillStyle(0x07111d, 0.9); g.fillRoundedRect(x - 1, y - 1, w + 2, h + 2, 4)
    if (!me) { this.hpText.setText(''); return }
    g.fillStyle(0x1a2740, 1); g.fillRoundedRect(x, y, w, h, 4)
    const pct = Math.max(0, Math.min(1, me.hp / me.maxHp))
    const col = pct > 0.5 ? 0x69f0ae : pct > 0.25 ? 0xffd54f : 0xff5252
    if (pct > 0) { g.fillStyle(col, 1); g.fillRoundedRect(x, y, Math.max(3, w * pct), h, 4) }
    this.hpText.setText(`${Math.max(0, Math.ceil(me.hp))}/${me.maxHp}`).setPosition(x + w + 8, y - 1)
  }
}
