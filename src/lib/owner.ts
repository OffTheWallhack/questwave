// Údaje o tebe a firme — zobrazujú sa v "O appke", zásadách a podmienkach.
// Pred spustením doplň všetko v [HRANATÝCH ZÁTVORKÁCH].
export const OWNER = {
  author: 'Robert Ďurica',
  company: '142 design s.r.o.',
  ico: '[IČO]',
  address: '[sídlo firmy]',
  email: '[kontaktný e-mail]',
  phone: '', // napr. '+421 9xx xxx xxx' — zobrazí sa ako kontakt
  instagram: '@duriica',
  year: 2026,
  since: 'september 2026',
}

/** Kontakt na zobrazenie — len vyplnené údaje (bez [zástupných] textov). */
export const CONTACT =
  [OWNER.phone, OWNER.email].filter((x) => x && !x.startsWith('[')).join(', ') || OWNER.instagram
