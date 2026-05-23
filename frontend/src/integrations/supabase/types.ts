export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BusinessCategory =
  | 'barbershop'
  | 'salon'
  | 'vet'
  | 'cafe'
  | 'gym'
  | 'other'

export type BusinessPlan = 'free' | 'pro'

export type ClientStatus = 'active' | 'at_risk' | 'lost'

export type CampaignTargetSegment = 'at_risk' | 'lost' | 'all' | 'frequent'
export type CampaignStatus = 'draft' | 'active' | 'sent' | 'archived'

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          category: BusinessCategory
          owner_id: string
          is_active: boolean
          plan: BusinessPlan
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: BusinessCategory
          owner_id: string
          is_active?: boolean
          plan?: BusinessPlan
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: BusinessCategory
          owner_id?: string
          is_active?: boolean
          plan?: BusinessPlan
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_configs: {
        Row: {
          id: string
          business_id: string
          stamps_required: number
          reward_description: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          stamps_required?: number
          reward_description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          stamps_required?: number
          reward_description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'loyalty_configs_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          id: string
          auth_id: string
          phone: string | null
          email: string | null
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          phone?: string | null
          email?: string | null
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          phone?: string | null
          email?: string | null
          full_name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_business_loyalty: {
        Row: {
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
        Insert: {
          id?: string
          client_id: string
          business_id: string
          stamp_count?: number
          total_visits?: number
          total_rewards?: number
          last_visit_at?: string | null
          status?: ClientStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          business_id?: string
          stamp_count?: number
          total_visits?: number
          total_rewards?: number
          last_visit_at?: string | null
          status?: ClientStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'client_business_loyalty_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'client_business_loyalty_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      visits: {
        Row: {
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
        Insert: {
          id?: string
          client_id: string
          business_id: string
          staff_id: string
          token_hash: string
          reward_unlocked?: boolean
          notes?: string | null
          idempotency_key: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          business_id?: string
          staff_id?: string
          token_hash?: string
          reward_unlocked?: boolean
          notes?: string | null
          idempotency_key?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'visits_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'visits_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      rewards: {
        Row: {
          id: string
          client_id: string
          business_id: string
          visit_id: string
          description: string
          redeemed: boolean
          redeemed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          business_id: string
          visit_id: string
          description: string
          redeemed?: boolean
          redeemed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          business_id?: string
          visit_id?: string
          description?: string
          redeemed?: boolean
          redeemed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rewards_client_id_fkey'
            columns: ['client_id']
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rewards_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rewards_visit_id_fkey'
            columns: ['visit_id']
            referencedRelation: 'visits'
            referencedColumns: ['id']
          },
        ]
      }
      campaigns: {
        Row: {
          id: string
          business_id: string
          title: string
          message_template: string
          target_segment: CampaignTargetSegment
          send_timing: string
          expected_lift: string
          status: CampaignStatus
          generated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          message_template: string
          target_segment: CampaignTargetSegment
          send_timing: string
          expected_lift: string
          status?: CampaignStatus
          generated_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          message_template?: string
          target_segment?: CampaignTargetSegment
          send_timing?: string
          expected_lift?: string
          status?: CampaignStatus
          generated_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
      staff_keys: {
        Row: {
          id: string
          business_id: string
          key_hash: string
          label: string
          is_active: boolean
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          key_hash: string
          label: string
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          key_hash?: string
          label?: string
          is_active?: boolean
          last_used_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'staff_keys_business_id_fkey'
            columns: ['business_id']
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
