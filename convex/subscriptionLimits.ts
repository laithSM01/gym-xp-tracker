export const LIMITS = {
  personal_trainer: { trainers: 0, clients: 20, products: 10 },
  gym_small:        { trainers: 2, clients: 100, products: 20 },
  gym_medium:       { trainers: 3, clients: 180, products: 30 },
  gym_large:        { trainers: 5, clients: 250, products: 50 },
} as const;

export type SubscriptionPlan = keyof typeof LIMITS;
