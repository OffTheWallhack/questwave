import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setSwirl } from '../components/Swirl'
import { CONTACT, OWNER } from '../lib/owner'
import { useSession } from '../lib/session'
import { BRAND } from '../lib/brand'

// POZOR: tieto texty sú poctivý základ, nie právna rada.
// Pred verejným spustením ich daj prečítať právnikovi a doplň údaje v src/lib/owner.ts.

type Section = [string, string]
type Doc = { title: string; updated: string; sections: Section[] }

const ABOUT: Record<'sk' | 'en', Doc> = {
  sk: {
    title: 'O appke',
    updated: `Prvá verzia: ${OWNER.since}`,
    sections: [
      [`Čo je ${BRAND.name}`, `${BRAND.tagline}. Každý deň dostane celá planéta v tej istej chvíli ten istý quest. Splníš ho, pridáš dôkaz a tvoja bodka sa rozsvieti na mape. Nie je to o súťažení proti sebe — je to o tom, že robíme niečo spolu.`],
      ['Kto za tým stojí', `Nápad, koncept a vývoj: ${OWNER.author}. Prevádzkovateľ: ${OWNER.company}. Kontakt: ${CONTACT}, Instagram ${OWNER.instagram}.`],
      ['Autorské práva', `© ${OWNER.year} ${OWNER.author} / ${OWNER.company}. Všetky práva vyhradené. Kód, dizajn, texty questov, kresby kariet a názov služby nesmú byť kopírované ani používané bez písomného súhlasu.`],
      ['Chceš pomôcť?', 'Navrhni quest alebo oprav preklad v profile. Každý návrh si prečítam.'],
    ],
  },
  en: {
    title: 'About',
    updated: `First version: ${OWNER.since}`,
    sections: [
      [`What is ${BRAND.name}`, `${BRAND.tagline}. Every day the whole planet gets the same quest at the same moment. Do it, add proof, and your dot lights up on the map. It is not about competing — it is about doing something together.`],
      ['Who is behind it', `Idea, concept and development: ${OWNER.author}. Operator: ${OWNER.company}. Contact: ${CONTACT}, Instagram ${OWNER.instagram}.`],
      ['Copyright', `© ${OWNER.year} ${OWNER.author} / ${OWNER.company}. All rights reserved. The code, design, quest texts, card artwork and name may not be copied or used without written permission.`],
      ['Want to help?', 'Suggest a quest or fix a translation in your profile. I read every one.'],
    ],
  },
}

const PRIVACY: Record<'sk' | 'en', Doc> = {
  sk: {
    title: 'Ochrana súkromia',
    updated: `Platné od ${OWNER.since}`,
    sections: [
      ['Kto spracúva tvoje údaje', `${OWNER.company}, IČO ${OWNER.ico}, ${OWNER.address} (ďalej „my"). Kontakt pre otázky k údajom: ${CONTACT}.`],
      ['Čo zbierame', 'E-mail (na prihlásenie), prezývku, jazyk, dôkazy, ktoré nahráš (fotky, videá, hlasovky), hodnotenie questu, mesto odhadnuté z časového pásma tvojho zariadenia (nie GPS), tvoje XP, sériu, zvolený gang, hype a návrhy, ktoré pošleš.'],
      ['Prečo', 'Aby appka fungovala: prihlásenie, svetový quest, feed, séria, glóbus. Právny základ je plnenie zmluvy, teda podmienok používania (čl. 6 ods. 1 písm. b GDPR). Tvoje údaje nepredávame a nepoužívame ich na reklamu.'],
      ['Čo vidia ostatní', 'Tvoju prezývku, gang, dôkazy a mesto pri príspevku vidia ostatní používatelia vo feede. Tvoj e-mail nevidí nikto okrem nás.'],
      ['Kde sú uložené', 'Databáza a súbory: Supabase, dátové centrum vo Frankfurte (EÚ). Webová stránka: Cloudflare. Prihlasovacie e-maily: poskytovateľ e-mailovej služby. Sú to naši spracovatelia a spracúvajú údaje len podľa našich pokynov.'],
      ['Ako dlho', 'Kým máš účet. Keď ho zmažeš (Profil → Zmazať účet), zmaže sa profil, prihlásenie, splnenia, hype aj nahrané súbory.'],
      ['Tvoje práva', 'Máš právo na prístup k údajom, opravu, výmaz, obmedzenie spracúvania, prenosnosť a námietku. Napíš nám na e-mail vyššie. Sťažnosť môžeš podať na Úrad na ochranu osobných údajov SR.'],
      ['Vek', 'Appka je pre ľudí od 16 rokov.'],
    ],
  },
  en: {
    title: 'Privacy',
    updated: `Effective ${OWNER.since}`,
    sections: [
      ['Who processes your data', `${OWNER.company}, company ID ${OWNER.ico}, ${OWNER.address} ("we"). Contact: ${CONTACT}.`],
      ['What we collect', 'Email (to sign in), username, language, the proof you upload (photos, videos, voice notes), quest ratings, a city estimated from your device time zone (not GPS), your XP, streak, chosen gang, hypes and suggestions you send.'],
      ['Why', 'To run the app: sign-in, world quest, feed, streaks, the globe. Legal basis: performance of a contract, i.e. the terms of use (Art. 6(1)(b) GDPR). We do not sell your data or use it for ads.'],
      ['What others see', 'Your username, gang, proof and city on a post are visible to other users in the feed. Nobody but us sees your email.'],
      ['Where it is stored', 'Database and files: Supabase, Frankfurt data centre (EU). Website: Cloudflare. Sign-in emails: an email delivery provider. They are our processors and act only on our instructions.'],
      ['How long', 'As long as you have an account. Deleting it (Profile → Delete account) removes your profile, login, completions, hypes and uploaded files.'],
      ['Your rights', 'You can access, correct, delete, restrict, port and object to processing of your data. Email us at the address above. You can also complain to the Slovak Data Protection Office.'],
      ['Age', 'The app is for people aged 16 and over.'],
    ],
  },
}

const TERMS: Record<'sk' | 'en', Doc> = {
  sk: {
    title: 'Podmienky používania',
    updated: `Platné od ${OWNER.since}`,
    sections: [
      ['Kto môže', `${BRAND.name} môžeš používať, ak máš aspoň 16 rokov. Registráciou súhlasíš s týmito podmienkami.`],
      ['Buď v bezpečí', 'Questy robíš v skutočnom svete na vlastnú zodpovednosť. Dodržuj zákony, nevstupuj tam, kam nemáš, neohrozuj seba ani iných. Ak ti quest pripadá nebezpečný, nerob ho.'],
      ['Čo nahrávaš', 'Dôkazy musia byť tvoje. Nenahrávaj nič nezákonné, násilné, sexuálne, urážlivé ani nič, čo porušuje súkromie iných — hlavne nie tváre cudzích ľudí bez ich súhlasu. Tvoj obsah ostáva tvoj. Nahraním nám dávaš bezplatné, nevýhradné povolenie zobrazovať ho v appke, kým ho nezmažeš.'],
      ['Moderovanie', 'Príspevky môžu ostatní nahlásiť. Obsah, ktorý porušuje tieto pravidlá, skryjeme a pri opakovaní môžeme zrušiť účet.'],
      ['Duševné vlastníctvo', `Appka, jej názov, dizajn, kód, kresby a texty questov patria ${OWNER.author} / ${OWNER.company}. Nesmieš ich kopírovať ani používať mimo appky bez súhlasu.`],
      ['Bez záruky', 'Appku robíme najlepšie, ako vieme, ale poskytujeme ju tak, ako je. Môže sa stať, že na chvíľu nepôjde alebo sa niečo stratí.'],
      ['Zmeny a právo', 'Podmienky môžeme meniť, o podstatných zmenách dáme vedieť v appke. Riadia sa právom Slovenskej republiky.'],
      ['Kontakt', CONTACT],
    ],
  },
  en: {
    title: 'Terms of use',
    updated: `Effective ${OWNER.since}`,
    sections: [
      ['Who can use it', `You may use ${BRAND.name} if you are at least 16. By signing up you agree to these terms.`],
      ['Stay safe', 'You do quests in the real world at your own risk. Follow the law, do not trespass, do not endanger yourself or others. If a quest feels unsafe, skip it.'],
      ['What you upload', 'Proof must be your own. Do not upload anything illegal, violent, sexual, offensive or anything that violates others\' privacy — especially strangers\' faces without consent. Your content stays yours. By uploading you give us a free, non-exclusive permission to show it in the app until you delete it.'],
      ['Moderation', 'Others can report posts. Content that breaks these rules will be hidden, and repeat offenders may lose their account.'],
      ['Intellectual property', `The app, its name, design, code, artwork and quest texts belong to ${OWNER.author} / ${OWNER.company}. Do not copy or use them outside the app without permission.`],
      ['No warranty', 'We do our best, but the app is provided as is. It may be unavailable at times or lose data.'],
      ['Changes and law', 'We may change these terms and will announce material changes in the app. Slovak law applies.'],
      ['Contact', CONTACT],
    ],
  },
}

const DOCS = { about: ABOUT, privacy: PRIVACY, terms: TERMS }

export default function Legal({ kind }: { kind: keyof typeof DOCS }) {
  const { lang, session } = useSession()
  const navigate = useNavigate()
  const doc = DOCS[kind][lang]

  useEffect(() => setSwirl(['#1B1530', '#2A1D4E', '#12303A']), [])

  return (
    <div className="space-y-4 px-3 pb-32 pt-4">
      <button onClick={() => (history.length > 1 ? navigate(-1) : navigate(session ? '/profile' : '/signin'))} className="inline-flex h-10 items-center gap-2 text-[22px] text-fog">
        <ArrowLeft size={18} /> {lang === 'sk' ? 'Späť' : 'Back'}
      </button>
      <div>
        <h1 className="display text-[52px]">{doc.title}</h1>
        <p className="text-[19px] text-fog">{doc.updated}</p>
      </div>
      {doc.sections.map(([h, body]) => (
        <section key={h} className="panel rounded-[12px] p-4">
          <h2 className="display text-[28px] text-gold">{h}</h2>
          <p className="mt-1 text-[21px] leading-[1.15]">{body}</p>
        </section>
      ))}
      <p className="px-1 text-center text-[18px] text-fog">
        <Link to="/about" className="underline">{ABOUT[lang].title}</Link> ·{' '}
        <Link to="/privacy" className="underline">{PRIVACY[lang].title}</Link> ·{' '}
        <Link to="/terms" className="underline">{TERMS[lang].title}</Link>
      </p>
    </div>
  )
}
