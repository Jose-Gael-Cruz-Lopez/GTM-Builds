// ─── Businesses ──────────────────────────────────────────────────────────────

export type BusinessCategory =
  | 'barbershop'
  | 'salon'
  | 'vet'
  | 'cafe'
  | 'gym'
  | 'other'

export type BusinessPlan = 'free' | 'pro'

export interface BusinessRow {
  id: string
  name: string
  category: BusinessCategory
  owner_id: string
  is_active: boolean
  plan: BusinessPlan
  tagline?: string | null
  logo_url?: string | null
  primary_color?: string | null
  address?: string | null
  phone?: string | null
  created_at: string
  updated_at: string
}

export interface BusinessInsert {
  name: string
  category: BusinessCategory
  owner_id: string
  is_active?: boolean
  plan?: BusinessPlan
}

// ─── Loyalty Config ──────────────────────────────────────────────────────────

export interface LoyaltyConfigRow {
  id: string
  business_id: string
  stamps_required: number
  reward_description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoyaltyConfigInsert {
  business_id: string
  stamps_required?: number
  reward_description?: string
  is_active?: boolean
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface ClientRow {
  id: string
  auth_id: string
  phone: string | null
  email: string | null
  full_name: string
  referral_code: string
  referred_by_client_id: string | null
  created_at: string
  updated_at: string
}

export interface ClientInsert {
  auth_id: string
  phone?: string | null
  email?: string | null
  full_name: string
  referral_code?: string
  referred_by_client_id?: string | null
}

// ─── Client-Business Loyalty ─────────────────────────────────────────────────

export type ClientStatus = 'active' | 'at_risk' | 'lost'

export interface ClientBusinessLoyaltyRow {
  id: string
  client_id: string
  business_id: string
  stamp_count: number
  total_visits: number
  total_rewards: number
  last_visit_at: string | null
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface ClientBusinessLoyaltyInsert {
  client_id: string
  business_id: string
  stamp_count?: number
  total_visits?: number
  total_rewards?: number
  last_visit_at?: string | null
  status?: ClientStatus
}

// ─── Visits ──────────────────────────────────────────────────────────────────

export interface VisitRow {
  id: string
  client_id: string
  business_id: string
  staff_id: string
  token_hash: string
  reward_unlocked: boolean
  notes: string | null
  idempotency_key: string
  created_at: string
}

export interface VisitInsert {
  client_id: string
  business_id: string
  staff_id: string
  token_hash: string
  reward_unlocked?: boolean
  notes?: string | null
  idempotency_key: string
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface RewardRow {
  id: string
  client_id: string
  business_id: string
  visit_id: string
  description: string
  redeemed: boolean
  redeemed_at: string | null
  created_at: string
}

export interface RewardInsert {
  client_id: string
  business_id: string
  visit_id: string
  description: string
  redeemed?: boolean
  redeemed_at?: string | null
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignTargetSegment = 'at_risk' | 'lost' | 'all' | 'frequent'
export type CampaignStatus = 'draft' | 'active' | 'sent' | 'archived'

export interface CampaignRow {
  id: string
  business_id: string
  title: string
  message_template: string
  target_segment: CampaignTargetSegment
  send_timing: string
  expected_lift: string
  status: CampaignStatus
  generated_by: string
  sent_at?: string | null
  created_at: string
  updated_at: string
}

export interface CampaignInsert {
  business_id: string
  title: string
  message_template: string
  target_segment: CampaignTargetSegment
  send_timing: string
  expected_lift: string
  status?: CampaignStatus
  generated_by?: string
}

// ─── Staff Keys ───────────────────────────────────────────────────────────────

export interface StaffKeyRow {
  id: string
  business_id: string
  key_hash: string
  label: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface StaffKeyInsert {
  business_id: string
  key_hash: string
  label: string
  is_active?: boolean
  last_used_at?: string | null
}

// ─── Database type map (for generic helpers) ─────────────────────────────────

export interface Database {
  businesses: { Row: BusinessRow; Insert: BusinessInsert }
  loyalty_configs: { Row: LoyaltyConfigRow; Insert: LoyaltyConfigInsert }
  clients: { Row: ClientRow; Insert: ClientInsert }
  client_business_loyalty: { Row: ClientBusinessLoyaltyRow; Insert: ClientBusinessLoyaltyInsert }
  visits: { Row: VisitRow; Insert: VisitInsert }
  rewards: { Row: RewardRow; Insert: RewardInsert }
  campaigns: { Row: CampaignRow; Insert: CampaignInsert }
  staff_keys: { Row: StaffKeyRow; Insert: StaffKeyInsert }
}
