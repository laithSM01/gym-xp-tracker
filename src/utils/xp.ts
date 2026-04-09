import type { Tier } from '@/types/client'

export const tierConfig: Record<Tier, { label: string; badge: string; bar: string; next?: string }> = {
  beginner: {
    label: 'Beginner',
    badge: 'bg-gray-100 text-gray-700 ring-gray-200',
    bar: 'bg-gray-400',
    next: 'Novice at 500 XP',
  },
  novice: {
    label: 'Novice',
    badge: 'bg-blue-100 text-blue-700 ring-blue-200',
    bar: 'bg-blue-500',
    next: 'Intermediate at 1,000 XP',
  },
  intermediate: {
    label: 'Intermediate',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
    next: 'Advanced at 2,000 XP',
  },
  advanced: {
    label: 'Advanced',
    badge: 'bg-purple-100 text-purple-700 ring-purple-200',
    bar: 'bg-purple-500',
    next: 'Elite at 3,000 XP',
  },
  elite: {
    label: 'Elite',
    badge: 'bg-green-100 text-green-700 ring-green-200',
    bar: 'bg-green-500',
  },
}

export const tierMin: Record<Tier, number> = {
  beginner: 0,
  novice: 500,
  intermediate: 1000,
  advanced: 2000,
  elite: 3000,
}

export const tierMax: Record<Tier, number> = {
  beginner: 500,
  novice: 1000,
  intermediate: 2000,
  advanced: 3000,
  elite: 3000,
}

export function xpProgress(xp: number, tier: Tier): number {
  if (tier === 'elite') return 100
  return Math.min(100, Math.round(((xp - tierMin[tier]) / (tierMax[tier] - tierMin[tier])) * 100))
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
