export const EQUIP = {
  bomb:    { normal: 0, strong: 15, super: 35, mighty: 60 },
  clothes: { cloth: 0, leather: 50, chain: 120, holy: 200 },
  shoes:   { sandals: 0, runners: 0.5, swift: 1.0, extreme: 1.5 },
} as const

export type BombType    = keyof typeof EQUIP.bomb
export type ClothesType = keyof typeof EQUIP.clothes
export type ShoesType   = keyof typeof EQUIP.shoes
