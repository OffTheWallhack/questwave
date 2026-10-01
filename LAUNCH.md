# Plán spustenia Questwave

Toto je poradie, v akom by som to robil. Technický postup k jednotlivým krokom je v `README.md`.

---

## Spustenie za 0 €

Na spustenie nepotrebuješ zaplatiť ani cent:

| Čo | Ako zadarmo |
|---|---|
| Adresa appky | `questwave.pages.dev` od Cloudflare |
| Kód | súkromné repo na GitHube |
| Databáza a fotky | bezplatný Supabase (500 MB dát, 1 GB fotiek — fotky sa zmenšujú v telefóne) |
| Prihlásenie | Google zadarmo + e-mailové kódy cez tvoj Gmail |
| Inštalácia na plochu | appka sa pridá na plochu ako ikonka, bez App Store |

## Týždeň 1 — Zaber si meno tam, kde je to zadarmo

1. **@questwave** na Instagrame, X a TikToku — hneď, päť minút.
2. **Projekt `questwave` na Cloudflare** — týmto si zaberieš `questwave.pages.dev`.
3. **Gmail `questwave.app@gmail.com`** (alebo podobný) — na odosielanie kódov a ako kontakt.
4. Over meno v [TMview](https://www.tmdn.org/tmview) a v [registri ÚPV SR](https://webregistre.indprop.gov.sk) — je to zadarmo.

Doména a ochranná známka počkajú, kým appka zarobí prvé peniaze. Dovtedy ťa chráni to, že si prvý a pod svojím menom.

## Ako chrániť, že je to tvoj nápad

Úprimne: **samotný nápad sa chrániť nedá** — nikto nemôže zakázať iným spraviť „denný quest pre celý svet". Chrániť sa dá toto:

- **Kód, dizajn, kresby, texty questov** — sú chránené autorským právom automaticky, od chvíle, keď vzniknú. Nič neregistruješ. V appke je už uvedené „© 2026 Robert Ďurica / 142 design s.r.o." a v repe je súbor `LICENSE`, ktorý kopírovanie výslovne zakazuje.
- **Dôkaz, kedy si čo vytvoril** — dátumy commitov v GitHube. Preto súkromné repo a commitovať často.
- **Meno** — len ochrannou známkou (týždeň 1).
- **Byť prvý a mať komunitu** — toto je v praxi najsilnejšia ochrana. Kto príde po tebe s kópiou, nemá tvojich ľudí, tvoje questy ani tvoj príbeh.

Súkromné repo na GitHube ti kód nikto „čmajzne" — vidíš ho len ty. Webová appka sa síce dá v prehliadači stiahnuť v zmenšenej, ťažko čitateľnej podobe (tak to je pri každej webovej stránke), ale tvoja databáza, pravidlá a administrácia sú na serveri a chránené.

Jedna vec, ktorú si over sám: **pracovná zmluva s Red Bullom.** Niektoré zmluvy riešia vedľajšie podnikanie alebo to, komu patrí, čo zamestnanec vytvorí. Pri tvojej pozícii to pravdepodobne nie je problém, ale oplatí sa to prečítať skôr, než za nimi pôjdeš so sponzorovaným questom.

## Týždeň 2 — Technické spustenie (podľa README)

1. Supabase (databáza) — 20 minút
2. Súkromné repo na GitHube — 10 minút
3. Cloudflare Pages (appka online) — 15 minút
4. Prihlásenie cez Google + Gmail na kódy — 30 minút
5. Sprav sa adminom a naplánuj prvý týždeň questov — 15 minút
6. Doplň `src/lib/owner.ts` (IČO, sídlo, kontakt) a pushni

## Týždeň 3–4 — Test s 20–30 ľuďmi

Nie verejne. Kamoši, kolegovia z eventov, ľudia okolo skejtu a DJingu.

- Každý deň naplánuj v admine svetový quest.
- Sleduj **jedno číslo: koľko ľudí sa vráti druhý a tretí deň.** Ak sa vráti aspoň tretina, máš niečo. Ak takmer nikto, meň questy, nie dizajn.
- Pýtaj sa, čo ich otravuje. Opravíme to.

## Mesiac 2 — Verejné spustenie

- Príspevok na Instagram a X pod tvojím menom: prečo si to spravil, video, ako to funguje. Je to zároveň verejný, datovaný záznam, že je to tvoj projekt.
- Prvý týždeň spoločný quest s niečím viditeľným (napr. zbieranie odpadu v konkrétny deň), ktorý ľudia zdieľajú.
- Flex Card do stories a „Pozvi kamoša" sú v appke práve na toto.

## Peniaze — realisticky

Peniaze prídu až po ľuďoch. Poradie:

1. **Sponzorovaný svetový quest** — najrýchlejšia cesta. Značka zaplatí za to, že v daný deň robí celý svet ich quest (v admine je na to pole „Sponzor"). Keď za niekým pôjdeš, ukáž mu **Čísla pre sponzorov** v admine: počet ľudí, aktívnych, splnení za deň, mestá. Začni pri stovkách aktívnych ľudí, s lokálnymi značkami a eventami.
2. **Firemné questy a teambuilding** — firmy platia za CSR a zapojenie zamestnancov.
3. **Kozmetika a sezónny pass** — až pri tisícoch aktívnych ľudí.

Faktúruj cez 142 design s.r.o.

## Náklady

Na štart **0 €**. Platiť začneš, až keď appka narastie:

| Čo | Kedy začne stáť peniaze |
|---|---|
| Supabase Pro (25 $ mesačne) | keď sa zaplní 1 GB fotiek alebo 500 MB dát |
| Vlastná doména (~10–15 € ročne) | keď chceš krajšiu adresu a profesionálne e-maily |
| Ochranná známka SR (170 €, elektronicky menej) | keď appka zaberie a chceš meno uzamknúť |

Prvé peniaze zo sponzorovaného questu investuj práve sem — v tomto poradí: doména, ochranná známka, Supabase Pro.

Fotky sa v appke zmenšujú ešte v telefóne (z ~4 MB na ~300 kB), takže bezplatné úložisko vydrží približne na niekoľko tisíc dôkazov. Keď sa bude plniť, prejdi na Supabase Pro.

Bezplatný Supabase projekt sa uspí po týždni, keď ho nikto nepoužíva — pri denne aktívnej appke sa to nestane.

---

*Toto nie je právna rada. Pri ochrannej známke a textoch zásad súkromia a podmienok sa oplatí hodina s právnikom.*
