// Malé nastavenia uložené v telefóne (zvuky, skryté nápovedy). Všetko v try/catch —
// v súkromnom okne alebo po vymazaní dát prehliadača úložisko môže chýbať, appka musí ísť aj tak.

const PREFIX = 'pomenato.'

export function getPref(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback
  } catch {
    return fallback
  }
}

export function setPref(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    /* nevadí */
  }
}

export const getFlag = (key: string, fallback = false) => getPref(key, fallback ? '1' : '0') === '1'
export const setFlag = (key: string, on: boolean) => setPref(key, on ? '1' : '0')
