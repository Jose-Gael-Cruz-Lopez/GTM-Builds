// Design system tokens, exported for use in Recharts / Framer Motion / canvas-confetti
// Mirrors CSS custom properties in styles.css

export const tokens = {
  color: {
    bgBase: '#0D0D0D',
    bgElevated: '#1A1A1A',
    bgPaper: '#F9F6EF',
    surface: '#FFFFFF',
    cream: '#F5E8D8',
    ink: '#0A0F1E',
    inkSoft: '#4A5160',
    signal: '#F5C518',
    celebrate: '#FF2D1A',
    health: '#C8F02A',
    statusGood: '#16A34A',
    statusWarn: '#F59E0B',
    statusRisk: '#EF4444',
    scannerWarm: '#C8A89A',
    dataBlue: '#2B8EFF',
  },
  radius: { sm: 8, md: 12, base: 14, lg: 22, xl: 28 },
  motion: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.32, durationSlow: 0.6 },
} as const

// Framer Motion presets
export const motionPresets = {
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: tokens.motion.duration, ease: tokens.motion.ease },
  },
  revealStagger: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: tokens.motion.durationSlow, ease: tokens.motion.ease },
  },
  pulseSubtle: {
    animate: { scale: [1, 1.02, 1] },
    transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity },
  },
  scanZoom: {
    animate: { scale: [1, 1.02, 1] },
    transition: { duration: 0.4, ease: tokens.motion.ease },
  },
}

// Recharts color palette
export const chartColors = {
  primary: tokens.color.dataBlue,
  health: tokens.color.health,
  ink: tokens.color.ink,
  good: tokens.color.statusGood,
  warn: tokens.color.statusWarn,
  risk: tokens.color.statusRisk,
  grid: 'rgba(10, 15, 30, 0.08)',
}

export const segmentColors = {
  active: tokens.color.statusGood,
  at_risk: tokens.color.statusWarn,
  lost: tokens.color.statusRisk,
}
