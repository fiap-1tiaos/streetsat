import { useCallback } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'

function ParticlesInner() {
  return (
    <Particles
      id="tsparticles"
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
      options={{
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        particles: {
          number: { value: 60 },
          color: { value: ['#00d4ff', '#f59e0b', '#ffffff'] },
          opacity: { value: { min: 0.05, max: 0.4 } },
          size: { value: { min: 1, max: 2.5 } },
          move: {
            enable: true,
            speed: 0.4,
            direction: 'none',
            random: true,
            outModes: { default: 'out' },
          },
          links: {
            enable: true,
            distance: 120,
            color: '#00d4ff',
            opacity: 0.07,
            width: 0.8,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: 'grab' },
            onClick: { enable: true, mode: 'push' },
          },
          modes: {
            grab: { distance: 140, links: { opacity: 0.2 } },
            push: { quantity: 2 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}

export function ParticlesBackground() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <ParticlesProvider init={init}>
      <ParticlesInner />
    </ParticlesProvider>
  )
}
