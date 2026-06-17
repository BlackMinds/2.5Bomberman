export const useCharacter = () => {
  const { headers } = useAuth()
  const char = useState<any>('character', () => null)

  const fetch = async () => {
    char.value = await $fetch('/api/character', { headers: headers.value })
  }

  const allocate = async (attr: string, points: number) => {
    await $fetch('/api/character/allocate', { method: 'POST', headers: headers.value, body: { attr, points } })
    await fetch()
  }

  const equip = async (slot: string, item: string) => {
    await $fetch('/api/character/equip', { method: 'POST', headers: headers.value, body: { slot, item } })
    await fetch()
  }

  return { char, fetch, allocate, equip }
}
