import { GANG_COLOR, type Gang } from '../lib/types'

export default function Avatar({ name, gang, size = 40 }: { name: string; gang: Gang | null; size?: number }) {
  const color = gang ? GANG_COLOR[gang] : '#8B8A95'
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        padding: 2,
        background: `conic-gradient(from 200deg, ${color}, ${color}55, ${color})`,
      }}
    >
      <span
        className="display-md grid h-full w-full place-items-center rounded-full bg-deck"
        style={{ fontSize: size * 0.38, color }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    </span>
  )
}
