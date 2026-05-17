import type { SupabaseClient } from '@supabase/supabase-js'

export interface Accessory {
  id: string
  name: string
  svg_url: string
}

export function calculateExpiration(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

export async function fetchUserAccessories(
  userId: string,
  client: SupabaseClient
): Promise<Accessory[]> {
  const now = new Date().toISOString()
  const { data: userAccs } = await client
    .from('user_accessories')
    .select('accessory_id')
    .eq('user_id', userId)
    .gt('expires_at', now)

  if (!userAccs || userAccs.length === 0) return []

  const ids = (userAccs as any[]).map((r) => r.accessory_id)
  const { data: accs } = await client
    .from('avatar_accessories')
    .select('id, name, svg_url')
    .in('id', ids)

  return (accs as Accessory[]) ?? []
}
