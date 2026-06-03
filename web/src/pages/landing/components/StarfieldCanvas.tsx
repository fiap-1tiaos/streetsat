import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  phase: number
  bright: boolean
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let stars: Star[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars = Array.from({ length: 800 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        bright: Math.random() < 0.025,
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 0.008

      for (const star of stars) {
        star.x -= star.speed
        if (star.x < -2) star.x = canvas.width + 2

        const twinkle = (Math.sin(time * (star.speed * 8) + star.phase) + 1) / 2
        const alpha = 0.3 + twinkle * 0.7 * star.opacity

        if (star.bright) {
          ctx.shadowBlur = 8
          ctx.shadowColor = '#00d4ff'
        } else {
          ctx.shadowBlur = 0
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * (star.bright ? 1.4 : 1), 0, Math.PI * 2)
        ctx.fillStyle = star.bright
          ? `rgba(180, 240, 255, ${alpha})`
          : `rgba(200, 220, 255, ${alpha * 0.8})`
        ctx.fill()
      }

      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
