import { supabase } from './supabase'
import type { Profile, ProofKind } from './types'
import { myCountry, myLocation, myRegion } from './world'

interface Args {
  profile: Profile
  file: File
  proofType: ProofKind
  rating: number
  questId: string | null
  daily: boolean
  /** napr. počet kusov odpadu — len pri queste s jednotkou */
  amount?: number | null
}

const MAX_VIDEO_MB = 25

/**
 * Fotku zmenší v telefóne ešte pred odoslaním (dlhšia strana 1600 px, JPEG).
 * Fotka z iPhonu má 3–5 MB, po zmenšení okolo 300 kB — úložisko vydrží ~10× dlhšie.
 */
async function shrinkPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const cv = document.createElement('canvas')
    cv.width = w
    cv.height = h
    cv.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, 'image/jpeg', 0.82))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], 'proof.jpg', { type: 'image/jpeg' })
  } catch {
    return file // napr. HEIC v prehliadači, ktorý ho nevie čítať — pošle sa originál
  }
}

/**
 * Nahrá dôkaz do vlastného priečinka a zapíše splnenie cez server.
 * XP a séria sa počítajú v databáze (complete_quest) — appka ich neposiela.
 */
export async function completeQuest({ profile, file: original, proofType, rating, questId, daily, amount = null }: Args) {
  if (original.type.startsWith('video/') && original.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`Video je príliš veľké. Maximum je ${MAX_VIDEO_MB} MB — nakrúť kratšie.`)
  }
  const file = proofType === 'photo' ? await shrinkPhoto(original) : original
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const path = `${profile.id}/${daily ? 'daily' : 'lib'}-${Date.now()}.${ext}`

  const up = await supabase.storage.from('proofs').upload(path, file, { contentType: file.type, upsert: false })
  if (up.error) throw up.error
  const { data: pub } = supabase.storage.from('proofs').getPublicUrl(path)

  const { data, error } = await supabase.rpc('complete_quest', {
    p_quest_id: questId,
    p_daily: daily,
    p_proof_url: pub.publicUrl,
    p_proof_type: proofType,
    p_rating: rating || null,
    p_city: myLocation().city,
    p_amount: amount,
    p_country: myCountry(),
    p_region: myRegion(),
  })
  if (error) {
    // dôkaz bez splnenia by v úložisku len zavadzal
    await supabase.storage.from('proofs').remove([path])
    throw error
  }
  const row = (Array.isArray(data) ? data[0] : data) as { gained: number; streak: number; rank: number }
  return { gained: row.gained, streak: row.streak, rank: row.rank, url: pub.publicUrl }
}
