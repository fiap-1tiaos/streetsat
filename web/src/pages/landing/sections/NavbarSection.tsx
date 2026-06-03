import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Como funciona', href: '#how-it-works' },
  { label: 'Arquitetura',   href: '#architecture' },
  { label: 'Demo ao vivo',  href: '#live-feed' },
]

export function NavbarSection() {
  const navigate = useNavigate()
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(href: string) {
    setMenuOpen(false)
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 h-16"
        style={{ borderBottomWidth: 1, borderBottomStyle: 'solid' }}
        animate={{
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(0px)',
          backgroundColor: scrolled ? 'rgba(2,4,8,0.88)' : 'rgba(2,4,8,0)',
          borderBottomColor: scrolled ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0)',
        }}
        transition={{ duration: 0.25 }}
      >
        {/* Logo */}
        <a href="/" className="flex items-center select-none">
          <img
            src="/streetsat-logo.png"
            alt="Streetsat"
            className="h-8 w-auto object-contain"
          />
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="hover:text-white transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <motion.button
          onClick={() => navigate('/admin/login')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg
                     border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-sm font-semibold
                     hover:border-[rgba(0,212,255,0.6)] hover:bg-[rgba(0,212,255,0.05)]
                     transition-colors duration-200 cursor-pointer bg-transparent"
        >
          Acesso Admin →
        </motion.button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <motion.div
        className="fixed inset-x-0 top-16 z-40 md:hidden"
        initial={false}
        animate={{ height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ overflow: 'hidden', backgroundColor: 'rgba(2,4,8,0.96)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex flex-col gap-1 px-6 py-4 border-b border-[rgba(0,212,255,0.07)]">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="text-left text-sm text-slate-300 hover:text-white py-2
                         border-none bg-transparent cursor-pointer transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); navigate('/admin/login') }}
            className="mt-2 text-left text-sm text-[#00d4ff] font-semibold py-2
                       border-none bg-transparent cursor-pointer"
          >
            Acesso Admin →
          </button>
        </div>
      </motion.div>
    </>
  )
}
