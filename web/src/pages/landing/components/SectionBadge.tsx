import { motion } from 'motion/react'

interface SectionBadgeProps {
  label: string
  color?: 'cyan' | 'amber' | 'green' | 'red'
}

const colorMap = {
  cyan:  'text-[#00d4ff] border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)]',
  amber: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  green: 'text-green-400 border-green-400/30 bg-green-400/5',
  red:   'text-red-400 border-red-400/30 bg-red-400/5',
}

export function SectionBadge({ label, color = 'cyan' }: SectionBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center px-3 py-1 rounded-full border
                  text-xs font-mono tracking-widest uppercase mb-4
                  ${colorMap[color]}`}
    >
      {label}
    </motion.span>
  )
}
