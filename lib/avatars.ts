export const AVATAR_STYLES = ['adventurer', 'avataaars', 'bottts', 'pixel-art']
export const AVATAR_SEEDS = ['alex', 'sam', 'jordan', 'taylor', 'morgan', 'kai', 'riley', 'casey', 'jamie', 'blake']

export function avatarUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`
}
