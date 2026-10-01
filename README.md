# Questwave

**World Multiplayer IRL**

Jeden quest. Celý svet. Každý deň.

Každý deň dostane celá planéta v tej istej chvíli ten istý quest. Splníš ho, nahráš dôkaz (fotka, video alebo hlasovka) a tvoja bodka sa rozsvieti na glóbuse. Vedľa toho je zásobník kariet s questami navyše.

**Stack:** Vite + React + TypeScript + Tailwind + Supabase. Hostuje sa zadarmo ako statická stránka (Cloudflare Pages), dá sa pridať na plochu telefónu ako appka.

© 2026 Robert Ďurica / 142 design s.r.o. Všetky práva vyhradené — pozri `LICENSE`.

---

## Spustenie — krok za krokom

Počítaj s hodinou až dvomi, ak to robíš prvýkrát. Nič z toho nestojí peniaze — všetko ide na bezplatných plánoch.

### 1. Databáza (Supabase)

1. Na [supabase.com](https://supabase.com) založ nový projekt. Región vyber **Frankfurt (eu-central-1)** — najbližšie k Slovensku. Heslo k databáze si ulož.
2. Vľavo **SQL Editor → New query**. Skopíruj celý obsah `supabase/01_schema.sql`, vlož, **Run**. Musí skončiť bez chyby.
3. Nová query, to isté so súborom `supabase/02_quests_seed.sql` (120 questov).
4. **Project Settings → API**: skopíruj si **Project URL** a **anon public** kľúč. Budeš ich potrebovať v kroku 3.

Úložisko na fotky (`proofs`) aj všetky pravidlá prístupu sa vytvoria samé v kroku 2 — nič neklikaj ručne.

### 2. Kód na GitHub — SÚKROMNÉ repo

Na [github.com/new](https://github.com/new) vytvor repozitár `questwave`, zaškrtni **Private** a nepridávaj README. Potom v priečinku projektu:

```bash
git init
git add .
git commit -m "Questwave — prvá verzia"
git branch -M main
git remote add origin https://github.com/OffTheWallhack/questwave.git
git push -u origin main
```

Súkromné repo = kód nikto nevidí. Každý commit má dátum a čas — to je tvoj dôkaz, kedy si čo vytvoril.

### 3. Nasadenie (Cloudflare Pages — zadarmo aj na zarábanie)

1. Na [dash.cloudflare.com](https://dash.cloudflare.com) si založ účet.
2. **Workers & Pages → Create → Pages → Connect to Git** → povoľ prístup k GitHubu a vyber repo `questwave`.
3. Nastavenie buildu:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. **Environment variables** (Production):
   - `VITE_SUPABASE_URL` = Project URL z kroku 1
   - `VITE_SUPABASE_ANON_KEY` = anon kľúč z kroku 1
   - `NODE_VERSION` = `20`
5. **Project name:** `questwave` → adresa bude `questwave.pages.dev` (ak je voľná).
6. **Save and Deploy.** O pár minút máš adresu `názov-projektu.pages.dev`. Každý ďalší `git push` appku automaticky aktualizuje.

Prečo nie Vercel: jeho bezplatný plán je podľa ich podmienok len na nekomerčné projekty. Cloudflare Pages komerčné použitie zadarmo dovoľuje.

Ak zabudneš premenné, appka ti to povie na obrazovke — nebude len biela.

### 4. Prihlasovanie (zadarmo, bez domény)

Bezplatný Supabase posiela prihlasovacie e-maily **len členom tvojho tímu**, nie cudzím ľuďom. Preto sú v appke dva spôsoby, ktoré fungujú bez domény aj bez peňazí.

**A) Prihlásenie cez Google — hlavný spôsob**

1. Choď na [console.cloud.google.com](https://console.cloud.google.com) a vytvor nový projekt `Questwave`.
2. **APIs & Services → OAuth consent screen**: typ **External**, názov `Questwave`, tvoj e-mail ako kontakt. Rozsahy nechaj základné (email, profile). Na konci daj **Publish app** — pri základných rozsahoch netreba overovanie od Googlu.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, typ **Web application**.
   - **Authorized redirect URIs:** `https://TVOJ-PROJEKT.supabase.co/auth/v1/callback` (presnú adresu nájdeš v Supabase → Authentication → Providers → Google).
4. Skopíruj **Client ID** a **Client secret** do Supabase → **Authentication → Providers → Google** a zapni ho.

**B) E-mailový kód cez Gmail — záloha pre ľudí bez Google účtu**

1. Založ si novú Gmail adresu len pre appku, napr. `questwave.app@gmail.com`.
2. V jej Google účte zapni **dvojstupňové overenie** a potom vytvor **heslo aplikácie** (Google účet → Zabezpečenie → Heslá aplikácií).
3. Supabase → **Authentication → Emails → SMTP Settings** → zapni **Custom SMTP**:
   - Host `smtp.gmail.com`, port `465`
   - Username: tá Gmail adresa, Password: heslo aplikácie
   - Sender email: tá istá Gmail adresa, Sender name: `Questwave`
4. **Authentication → Emails → Templates → Magic Link**: pridaj do textu riadok s kódom, napr.
   ```
   Tvoj kód do Questwave: {{ .Token }}
   ```
   Bez kódu nepôjde prihlásenie v appke pridanej na plochu iPhonu.

Gmail zvládne pár stoviek e-mailov denne — na štart bohato. Keď budeš mať doménu, prejdeš na službu ako Resend.

**Nakoniec:** Supabase → **Authentication → URL Configuration**:
- **Site URL** = `https://questwave.pages.dev` (alebo aká adresa ti vyšla v Cloudflare)
- **Redirect URLs** → pridaj tú istú adresu

### 5. Sprav sa adminom

1. Otvor appku, prihlás sa a vytvor si profil.
2. V Supabase **SQL Editor**:
   ```sql
   update profiles set is_admin = true where username = 'tvoja-prezývka';
   ```
3. V appke **Profil → Admin**. Tam plánuješ svetové questy na 14 dní dopredu, pridávaš sponzora a riešiš návrhy a nahlásenia od ľudí.

### 6. Na plochu telefónu

- **iPhone:** otvor adresu v Safari → tlačidlo Zdieľať → **Pridať na plochu**.
- **Android:** Chrome → menu → **Inštalovať aplikáciu**.

Potom sa to správa ako appka: ikonka, celá obrazovka, bez lišty prehliadača. Na vlastnej adrese funguje aj náklon kariet cez gyroskop.

---

## Pred verejným spustením

- **Doplň údaje v `src/lib/owner.ts`** (IČO, sídlo, kontaktný e-mail — môže byť tá Gmail adresa appky). Zobrazujú sa v zásadách ochrany súkromia a podmienkach, ktoré sú už v appke.
- **Moderovanie.** Ľudia môžu príspevky nahlásiť a ty ich v admine skryješ. Pri stovkách ľudí to stačí.
- **Neskôr, keď bude na čo:** vlastná doména (Cloudflare → projekt → Custom domains), e-maily cez Resend na tvojej doméne, ochranná známka. Nič z toho nie je potrebné na spustenie.

## Ako funguje svetový quest

- Mení sa o **00:00 UTC** pre celý svet naraz (u nás o 1:00 v zime, o 2:00 v lete).
- Ak na daný deň nič nenaplánuješ, appka si sama vytiahne náhodný quest zo zásobníka, ktorý sa 90 dní nepoužil. Nikdy nie je prázdna.
- XP, séria a poradie sa počítajú **na serveri**. Appka ich neposiela, takže sa nedajú podvádzať.

## Štatistiky svetového questu

Pri svetovom queste môžeš v admine vyplniť **jednotku** (napr. „kusov odpadu" / „pieces of litter"), **strop na človeka** a **cieľ sveta**. Potom:

- ľudia pri dôkaze zadajú svoj počet (−/+ a rýchle tlačidlá +5, +10, +25),
- na obrazovke Dnes sa ukáže **svetový súčet** s postupom k cieľu, **počet ľudí**, **priemer na človeka**, **rekord dňa**,
- **tvoje poradie**: miesto, „lepší než X %", koľkonásobok priemeru a čo ti chýba do priemeru,
- **rebríčky**: gangy (podľa priemeru na člena, aby veľkosť gangu nerozhodovala), krajiny, svetadiely a mestá — tvoj riadok je zvýraznený,
- oslava po splnení: „+23 kusov odpadu. Svet má spolu 16 745."

Všetko sa počíta na serveri (`quest_stats`), počet nad strop server odmietne a nahlásené skryté príspevky sa nerátajú. Krajina a svetadiel sa berú z časového pásma telefónu, nie z GPS.

## Gangy — až neskôr a dobrovoľne

- Pri registrácii sa nikam nepridávaš — zadáš len prezývku a vek. Každý na začiatku patrí **celému svetu** (zlatá karta).
- Gangy sa odomknú po **5 splnených questoch** (v deme po 2). Dovtedy vidíš v profile postup.
- Appka odporučí gang podľa toho, aké questy najčastejšie robíš: pomoc → Builders, adrenalín → Speedrunners, nuda a objavovanie → Looters, čakanie a ľudia → Nightcrawlers. Pri remíze nič neodporúča.
- **Ostať vo svete** je rovnocenná voľba a z gangu sa dá kedykoľvek odísť.
- Pravidlo „až po 5 questoch" stráži databáza (`choose_gang`), nie len appka.

## Bezpečnosť (overené testami na Postgrese)

- XP ani sériu si nikto nevie dopísať sám.
- Splnenie sa dá zapísať len cez server, s dôkazom z vlastného priečinka.
- Svetový quest sa dá splniť raz za deň, ten istý quest zo zásobníka tiež raz za deň.
- Fotky sa dajú nahrať len do vlastného priečinka.
- Plánovať questy a skrývať príspevky môže len admin.
- Gang sa nedá zvoliť pri registrácii ani pred piatym splneným questom.
- Zmazanie účtu odstráni prihlásenie, profil, splnenia, hype aj súbory.

## Demo bez databázy

```bash
npm run build:demo
```

Vyrobí `dist-demo/index.html` — celú appku v jednom súbore s vymyslenými dátami. Na pitch.

## Lokálny vývoj

```bash
cp .env.example .env   # doplň URL a kľúč
npm install
npm run dev
```

## Dizajn

- **Pixelové písmo** Jersey 10, **krútiace sa pozadie** (WebGL shader v nízkom rozlíšení), **CRT efekt** obrazovky.
- **Panely a tlačidlá s hĺbkou** — hrubý tmavý okraj, tvrdý tieň, tlačidlo sa pri stlačení zatlačí.
- **Karty questov** v krémovom ráme s **pixel-art kresbou**, ktorá sa generuje z ID questu (nálada = výtvarný jazyk, prostredie = motív). Rarity ako edície: **bežná**, **vzácna — fóliová**, **ultra vzácna — polychrómová**. Karty sa nakláňajú podľa telefónu (gyroskop).
- **Pixelový glóbus** so živými bodkami ľudí, ktorí quest práve splnili.

## Štruktúra

```
src/
  pages/        Today, Feed, Library, ProfilePage, Admin, SignIn, Onboarding
  components/   Globe, Swirl, QuestCard, Holo, PixelArt, HoloCard, ProofSheet,
                Celebration, MotionChip, TabBar, Sheet, Avatar…
  lib/          supabase, complete (splnenie cez server), cardArt, pixelArt,
                tilt (gyroskop), flexcard, world, progress, mock (demo)
supabase/
  01_schema.sql        tabuľky, pravidlá, funkcie, úložisko
  02_quests_seed.sql   120 questov
public/         ikonky, manifest (inštalácia na plochu)
public/_redirects, _headers   nasadenie na Cloudflare Pages
```
