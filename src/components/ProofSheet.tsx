import { Camera, Mic, Minus, Plus, RefreshCw, Square, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '../lib/session'
import type { ProofKind } from '../lib/types'
import Sheet from './Sheet'

interface Props {
  open: boolean
  onClose: () => void
  questTitle: string
  proofType: ProofKind
  xp: number
  /** quest s počítaním, napr. kusy odpadu */
  metric?: { label: string; max: number } | null
  onSubmit: (file: File, rating: number, amount: number | null) => Promise<void>
}

const COPY = {
  sk: {
    title: 'Dôkaz',
    photo: ['Odfoť to', 'Bez filtrov. Tak, ako to naozaj bolo.'],
    video: ['Nakrúť to', 'Pár sekúnd stačí.'],
    voice: ['Povedz to nahlas', 'Nahraj hlasovku, čo si urobil a ako to dopadlo.'],
    stop: 'Zastaviť nahrávanie',
    change: 'Zmeniť',
    rate: 'Aké to bolo?',
    rates: ['Nič moc', 'Ok', 'Dobré', 'Super', 'Legendárne'],
    send: 'Odoslať dôkaz',
    sending: 'Odosielam',
    fail: 'Dôkaz sa nepodarilo nahrať. Skontroluj pripojenie a skús to znova.',
  },
  en: {
    title: 'Proof',
    photo: ['Take a photo', 'No filters. The way it really was.'],
    video: ['Record it', 'A few seconds is enough.'],
    voice: ['Say it out loud', 'Record a voice note of what you did and how it went.'],
    stop: 'Stop recording',
    change: 'Change',
    rate: 'How was it?',
    rates: ['Meh', 'Ok', 'Good', 'Great', 'Legendary'],
    send: 'Send proof',
    sending: 'Sending',
    fail: 'Could not upload your proof. Check your connection and try again.',
  },
}

export default function ProofSheet({ open, onClose, questTitle, proofType, xp, metric = null, onSubmit }: Props) {
  const { lang } = useSession()
  const c = COPY[lang]
  const input = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [amount, setAmount] = useState(0)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setRating(0)
      setAmount(0)
      setError(null)
      setBusy(false)
    }
  }, [open])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  function pick(f: File | null) {
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function toggleVoice() {
    if (recording) {
      recorder.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' })
        pick(new File([blob], 'voice.webm', { type: blob.type }))
      }
      recorder.current = r
      setSeconds(0)
      r.start()
      setRecording(true)
    } catch {
      // mikrofón nedostupný — ponúkni nahratie súboru
      input.current?.click()
    }
  }

  async function send() {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(file, rating, metric ? amount : null)
    } catch (e) {
      const msg = e instanceof Error && /MB|splnil|splnený|počet/.test(e.message) ? e.message : (e as { message?: string })?.message && /splnil|splnený/.test((e as { message: string }).message) ? (e as { message: string }).message : c.fail
      setError(msg)
      setBusy(false)
    }
  }

  const [label, hint] = c[proofType]
  const Icon = proofType === 'photo' ? Camera : proofType === 'video' ? Video : Mic

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-6 px-5 pb-2 pt-3">
        <div>
          <p className="label">{c.title}</p>
          <h2 className="display-md mt-1 text-[30px]">{questTitle}</h2>
        </div>

        <input
          ref={input}
          type="file"
          className="hidden"
          accept={proofType === 'photo' ? 'image/*' : proofType === 'video' ? 'video/*' : 'audio/*'}
          capture={proofType === 'voice' ? undefined : 'environment'}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        {!file ? (
          proofType === 'voice' ? (
            <div className="flex flex-col items-center gap-4 rounded-[14px] bg-white/[0.04] px-6 py-10 text-center">
              <button
                type="button"
                onClick={toggleVoice}
                aria-label={recording ? c.stop : label}
                className="relative grid h-24 w-24 place-items-center rounded-full iri-bg text-void"
              >
                {recording && <span className="absolute inset-0 animate-ping rounded-full bg-white/25" />}
                {recording ? <Square size={30} fill="currentColor" /> : <Mic size={34} />}
              </button>
              <div>
                <p className="display-md text-lg">{recording ? `0:${String(seconds).padStart(2, '0')}` : label}</p>
                <p className="mt-1 text-sm text-fog">{recording ? c.stop : hint}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-[14px] bg-white/[0.04] text-center transition active:scale-[0.99]"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full iri-bg text-void">
                <Icon size={32} />
              </span>
              <span>
                <span className="display-md block text-xl">{label}</span>
                <span className="mt-1 block text-sm text-fog">{hint}</span>
              </span>
            </button>
          )
        ) : (
          <div className="relative overflow-hidden rounded-[14px]">
            {proofType === 'photo' && <img src={preview!} alt="" className="aspect-[4/5] w-full object-cover" />}
            {proofType === 'video' && <video src={preview!} controls playsInline className="aspect-[4/5] w-full object-cover" />}
            {proofType === 'voice' && <audio src={preview!} controls className="w-full" />}
            <button
              type="button"
              onClick={() => (proofType === 'voice' ? pick(null) : input.current?.click())}
              className="glass absolute right-3 top-3 flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium"
            >
              <RefreshCw size={15} /> {c.change}
            </button>
          </div>
        )}

        {metric && (
          <div className="panel-dark rounded-[12px] p-3">
            <p className="text-[20px] text-fog">
              {lang === 'sk' ? 'Koľko' : 'How many'} <span className="text-chalk">{metric.label}</span>?
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                aria-label="−"
                onClick={() => setAmount((a) => Math.max(0, a - 1))}
                className="btn btn-ghost h-14 w-14 px-0"
              >
                <Minus size={22} />
              </button>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(Math.min(metric.max, Math.max(0, parseInt(e.target.value.replace(/\D/g, '') || '0', 10))))}
                className="chip-box num h-16 min-w-0 flex-1 rounded-[12px] bg-gold text-center text-[56px] text-ink outline-none [text-shadow:none]"
              />
              <button
                type="button"
                aria-label="+"
                onClick={() => setAmount((a) => Math.min(metric.max, a + 1))}
                className="btn btn-ghost h-14 w-14 px-0"
              >
                <Plus size={22} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {[5, 10, 25].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount((a) => Math.min(metric.max, a + n))}
                  className="btn btn-blue h-10 flex-1 px-0 text-[20px]"
                >
                  +{n}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[16px] text-fog">
              {lang === 'sk' ? 'Na fotke by malo byť vidno, čo si nazbieral. Max' : 'Your photo should show what you collected. Max'} {metric.max}.
            </p>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="label">{c.rate}</p>
            <p className="text-sm font-medium">{rating ? c.rates[rating - 1] : ''}</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={c.rates[n - 1]}
                onClick={() => setRating(n)}
                className={'h-3 flex-1 rounded-full transition ' + (n <= rating ? 'iri-bg' : 'bg-white/10')}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-[#FF7A1A]">{error}</p>}

        <button className="btn btn-iri w-full" disabled={!file || busy || (metric !== null && amount < 1)} onClick={send}>
          {busy ? c.sending + '…' : `${c.send}  +${xp} XP`}
        </button>
      </div>
    </Sheet>
  )
}
