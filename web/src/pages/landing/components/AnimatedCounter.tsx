import { useRef } from 'react'
import { useInView } from 'motion/react'
import { useCountUp } from '@/hooks/useCountUp'

interface Props {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}

export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2000 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const count = useCountUp(value, duration, inView)

  const formatted = count >= 1000
    ? count.toLocaleString('pt-BR')
    : count.toString()

  return (
    <span
      ref={ref}
      className={inView ? 'text-glow-cyan' : ''}
      style={{ transition: 'text-shadow 0.5s ease' }}
    >
      {prefix}{formatted}{suffix}
    </span>
  )
}
