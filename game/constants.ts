export const COLS = 13
export const ROWS = 11
export const TW = 64   // tile width
export const TH = 32   // tile height (isometric)

export function toScreen(tx: number, ty: number, tz = 0) {
  return {
    x: (tx - ty) * (TW / 2),
    y: (tx + ty) * (TH / 2) - tz * TH,
  }
}

export const PLAYER_COLORS = [0x4fc3f7, 0xef9a9a, 0xa5d6a7, 0xfff176]
export const ENEMY_COLOR   = 0xff5722
