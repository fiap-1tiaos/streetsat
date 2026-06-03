import { useScroll, useSpring, motion } from 'motion/react'

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50 })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #00d4ff, #7dd3fc)',
      }}
    />
  )
}
