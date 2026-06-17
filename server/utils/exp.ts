export const expToNext = (level: number) => level * 100

export function calcLevelUp(exp: number, level: number, freePoints: number) {
  let e = exp, l = level, p = freePoints
  while (e >= expToNext(l)) { e -= expToNext(l); l++; p += 3 }
  return { exp: e, level: l, freePoints: p }
}
