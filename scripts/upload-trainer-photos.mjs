// One-off script: uploads trainer photos to Supabase Storage.
// Run from the fitter/ directory: node scripts/upload-trainer-photos.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
)

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
)

const BUCKET = 'trainer-photos'

const uploads = [
  {
    local: resolve(__dirname, '../public/images/aaron-brown-hero-2.jpg'),
    remote: 'aaron-brown/hero.jpg',
    type: 'image/jpeg',
  },
  {
    local: resolve(__dirname, '../public/images/aaron-brown-avatar.jpg'),
    remote: 'aaron-brown/avatar.jpg',
    type: 'image/jpeg',
  },
]

for (const { local, remote, type } of uploads) {
  const file = readFileSync(local)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(remote, file, { contentType: type, upsert: true })

  if (error) {
    console.error(`✗ ${remote}: ${error.message}`)
  } else {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(remote)
    console.log(`✓ ${remote}`)
    console.log(`  ${data.publicUrl}`)
  }
}
