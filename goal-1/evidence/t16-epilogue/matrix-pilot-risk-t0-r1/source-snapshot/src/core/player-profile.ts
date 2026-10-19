import { z } from 'zod'
export const playerProfileSchema=z.strictObject({wishId:z.enum(['financial_independence','own_brand','important_technology','autonomy']),approach:z.enum(['first_order','investment','free'])})
export type PlayerProfile=z.infer<typeof playerProfileSchema>
export const DEFAULT_PLAYER_PROFILE:PlayerProfile={wishId:'autonomy',approach:'free'}
