import type { SupabaseClient } from '@supabase/supabase-js'

export interface Accessory {
  id: string
  name: string
  svg_url: string
  rarity: string
}

export async function fetchUserAccessories(
  userId: string,
  client: SupabaseClient
): Promise<Accessory[]> {
  const { data: userAccs } = await client
    .from('user_accessories')
    .select('accessory_id')
    .eq('user_id', userId)

  if (!userAccs || userAccs.length === 0) return []

  const ids = (userAccs as any[]).map((r) => r.accessory_id)
  const { data: accs } = await client
    .from('avatar_accessories')
    .select('id, name, svg_url, rarity')
    .in('id', ids)

  return (accs as Accessory[]) ?? []
}
