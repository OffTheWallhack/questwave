import { useEffect, useRef } from 'react'

// Krútiace sa psychedelické pozadie v nízkom rozlíšení (pixely sú zámerne vidieť).
// Farby sa plynule prelievajú podľa obrazovky — setSwirl([...]).

type RGB = [number, number, number]
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB

let target: RGB[] = [hex('#1B1530'), hex('#4A2A7A'), hex('#12585E')]
/** Stmaví farbu, aby pozadie nikdy neprebilo text. */
export function shade(hexColor: string, f = 0.45) {
  const [r, g, b] = hex(hexColor).map((v) => Math.round(v * f * 255))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export function setSwirl(colors: [string, string, string]) {
  target = colors.map(hex)
}

const FRAG = `
precision mediump float;
uniform float t;
uniform vec2 res;
uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  a += 1.1 / (r + 0.45) + t * 0.05;
  vec2 p = vec2(cos(a), sin(a)) * r * 3.2;
  for (int i = 0; i < 5; i++) {
    p += vec2(sin(p.y * 1.25 + t * 0.22), cos(p.x * 1.1 - t * 0.19)) * 0.5;
  }
  float v = sin(p.x + p.y) * 0.5 + 0.5;
  float w = sin(length(p) * 1.6 - t * 0.3) * 0.5 + 0.5;
  vec3 col = mix(c1, c2, smoothstep(0.25, 0.85, v));
  col = mix(col, c3, smoothstep(0.55, 0.95, w) * 0.85);
  col = floor(col * 14.0) / 14.0;
  gl_FragColor = vec4(col, 1.0);
}`

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

export default function Swirl() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const gl = cv.getContext('webgl', { antialias: false, preserveDrawingBuffer: false })
    if (!gl) return

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uT = gl.getUniformLocation(prog, 't')
    const uR = gl.getUniformLocation(prog, 'res')
    const uC = [1, 2, 3].map((i) => gl.getUniformLocation(prog, 'c' + i))
    const cur = target.map((c) => [...c]) as RGB[]

    const PX = 6 // veľkosť "pixelu" pozadia
    const resize = () => {
      cv.width = Math.ceil(innerWidth / PX)
      cv.height = Math.ceil(innerHeight / PX)
      gl.viewport(0, 0, cv.width, cv.height)
    }
    resize()
    addEventListener('resize', resize)

    let raf = 0
    let last = 0
    const start = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 1000 / 30) return // 30 fps stačí a šetrí batériu
      last = now
      for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) cur[k][j] += (target[k][j] - cur[k][j]) * 0.04
      gl.uniform1f(uT, (now - start) / 1000)
      gl.uniform2f(uR, cv.width, cv.height)
      uC.forEach((u, k) => gl.uniform3fv(u, cur[k]))
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pixel fixed inset-0 -z-10 h-full w-full"
      style={{ background: 'radial-gradient(circle at 50% 40%, #4A2A7A, #1B1530 70%)' }}
    />
  )
}
