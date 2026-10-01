import type { Lang } from './types'

const dict = {
  today: { sk: 'Dnes', en: 'Today' },
  feed: { sk: 'Feed', en: 'Feed' },
  library: { sk: 'Zásobník', en: 'Library' },
  profile: { sk: 'Profil', en: 'Profile' },
  worldQuest: { sk: 'Dnešný quest pre celý svet', en: "Today's quest for the whole world" },
  done: { sk: 'Splnené', en: 'Done' },
  peopleDone: { sk: 'ľudí to dnes už dalo', en: 'people did it today' },
  firstToday: { sk: 'Dnes to ešte nikto nedal. Môžeš byť prvý.', en: 'Nobody has done it today. You can be first.' },
  endsIn: { sk: 'Končí o', en: 'Ends in' },
  streak: { sk: 'Séria', en: 'Streak' },
  best: { sk: 'Najlepšia', en: 'Best' },
  days: { sk: 'dní', en: 'days' },
  yourState: { sk: 'Aký máš teraz stav?', en: 'What is your state right now?' },
  anotherOne: { sk: 'Daj iný', en: 'Give me another' },
  back: { sk: 'Späť', en: 'Back' },
  upload: { sk: 'Nahrať dôkaz', en: 'Upload proof' },
  proofPhoto: { sk: 'Odfoť to', en: 'Take a photo' },
  proofVideo: { sk: 'Nakrúť to', en: 'Record a video' },
  proofVoice: { sk: 'Povedz to nahlas', en: 'Say it out loud' },
  rate: { sk: 'Aké to bolo?', en: 'How was it?' },
  submit: { sk: 'Odoslať', en: 'Submit' },
  sending: { sk: 'Odosielam…', en: 'Sending…' },
  alreadyDone: { sk: 'Dnešný quest máš splnený.', en: 'You have done today\'s quest.' },
  emptyFeed: { sk: 'Ešte nikto nič nenahral. Buď prvý.', en: 'Nobody has posted yet. Be the first.' },
  signIn: { sk: 'Poslať odkaz na e-mail', en: 'Send me a sign-in link' },
  signOut: { sk: 'Odhlásiť sa', en: 'Sign out' },
  emailSent: { sk: 'Pozri si e-mail. Poslali sme ti odkaz na prihlásenie.', en: 'Check your email for a sign-in link.' },
  suggest: { sk: 'Navrhni quest alebo oprav preklad', en: 'Suggest a quest or fix a translation' },
  flexCard: { sk: 'Stiahnuť Flex Card', en: 'Download Flex Card' },
  xp: { sk: 'XP', en: 'XP' },
  noDaily: { sk: 'Na dnes zatiaľ nie je quest. Skús zásobník.', en: 'No quest for today yet. Try the library.' },
  loading: { sk: 'Načítavam…', en: 'Loading…' },
  chooseGang: { sk: 'Vyber si gang', en: 'Pick your gang' },
  username: { sk: 'Prezývka', en: 'Username' },
  age16: { sk: 'Mám 16 alebo viac rokov', en: 'I am 16 or older' },
  start: { sk: 'Začať', en: 'Start' },
  sponsoredBy: { sk: 'Dnešný quest prináša', en: "Today's quest is brought by" },
  minutes: { sk: 'min', en: 'min' },
  history: { sk: 'Čo máš za sebou', en: 'What you have done' },
  errorGeneric: { sk: 'Nepodarilo sa to uložiť. Skús to znova.', en: 'Could not save that. Try again.' },
} as const

export type Key = keyof typeof dict
export const t = (key: Key, lang: Lang) => dict[key][lang]

export const MOODS = [
  { id: 'adrenalin', sk: 'Potrebujem adrenalín', en: 'I need adrenaline' },
  { id: 'pomoc', sk: 'Chcem pomôcť', en: 'I want to help' },
  { id: 'nuda', sk: 'Maximálna nuda', en: 'Maximum boredom' },
  { id: 'cakanie', sk: 'Čakám, nemám čas', en: 'Waiting, no time' },
] as const

export const PROOF_LABEL: Record<string, Key> = {
  photo: 'proofPhoto',
  video: 'proofVideo',
  voice: 'proofVoice',
}
