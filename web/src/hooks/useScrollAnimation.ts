import { useInView } from 'motion/react'
import { useRef } from 'react'

export function useScrollAnimation(options?: { margin?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isInView = useInView(ref, {
    once: options?.once ?? true,
    margin: (options?.margin ?? '-80px') as any,
  })
  return { ref, isInView }
}
