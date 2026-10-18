export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      health_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          follow_up_date: string | null
          id: string
          livestock_id: string
          owner_id: string
          professional_involved: string | null
          reported_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          follow_up_date?: string | null
          id?: string
          livestock_id: string
          owner_id?: string
          professional_involved?: string | null
          reported_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          follow_up_date?: string | null
          id?: string
          livestock_id?: string
          owner_id?: string
          professional_involved?: string | null
          reported_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_events_livestock_owner_fk"
            columns: ["livestock_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      livestock: {
        Row: {
          acquisition_date: string | null
          acquisition_source: string | null
          archived_at: string | null
          breed: string | null
          created_at: string
          date_of_birth: string | null
          estimated_age_unit: string | null
          estimated_age_value: number | null
          id: string
          identification_code: string | null
          name: string | null
          notes: string | null
          owner_id: string
          purpose: string | null
          quantity: number
          record_type: string
          sex: string | null
          species: string
          status: string
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_source?: string | null
          archived_at?: string | null
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          estimated_age_unit?: string | null
          estimated_age_value?: number | null
          id?: string
          identification_code?: string | null
          name?: string | null
          notes?: string | null
          owner_id?: string
          purpose?: string | null
          quantity?: number
          record_type: string
          sex?: string | null
          species: string
          status?: string
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          acquisition_source?: string | null
          archived_at?: string | null
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          estimated_age_unit?: string | null
          estimated_age_value?: number | null
          id?: string
          identification_code?: string | null
          name?: string | null
          notes?: string | null
          owner_id?: string
          purpose?: string | null
          quantity?: number
          record_type?: string
          sex?: string | null
          species?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          location: string | null
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          location?: string | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          location?: string | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatment_records: {
        Row: {
          administered_by: string | null
          administration_date: string | null
          assessment_date: string | null
          created_at: string
          dose_and_instructions: string | null
          farmer_observations: string | null
          follow_up_date: string | null
          id: string
          livestock_id: string
          medicine_name: string | null
          notes: string | null
          owner_id: string
          record_date: string
          reported_problem: string
          treatment_plan: string | null
          treatment_status: string
          updated_at: string
          veterinarian_name: string | null
          veterinary_assessment: string | null
        }
        Insert: {
          administered_by?: string | null
          administration_date?: string | null
          assessment_date?: string | null
          created_at?: string
          dose_and_instructions?: string | null
          farmer_observations?: string | null
          follow_up_date?: string | null
          id?: string
          livestock_id: string
          medicine_name?: string | null
          notes?: string | null
          owner_id?: string
          record_date: string
          reported_problem: string
          treatment_plan?: string | null
          treatment_status?: string
          updated_at?: string
          veterinarian_name?: string | null
          veterinary_assessment?: string | null
        }
        Update: {
          administered_by?: string | null
          administration_date?: string | null
          assessment_date?: string | null
          created_at?: string
          dose_and_instructions?: string | null
          farmer_observations?: string | null
          follow_up_date?: string | null
          id?: string
          livestock_id?: string
          medicine_name?: string | null
          notes?: string | null
          owner_id?: string
          record_date?: string
          reported_problem?: string
          treatment_plan?: string | null
          treatment_status?: string
          updated_at?: string
          veterinarian_name?: string | null
          veterinary_assessment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_livestock_owner_fk"
            columns: ["livestock_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          administered_by_name: string | null
          batch_number: string | null
          created_at: string
          id: string
          livestock_id: string
          next_due_date: string | null
          notes: string | null
          owner_id: string
          updated_at: string
          vaccination_date: string
          vaccine_name: string
        }
        Insert: {
          administered_by_name?: string | null
          batch_number?: string | null
          created_at?: string
          id?: string
          livestock_id: string
          next_due_date?: string | null
          notes?: string | null
          owner_id?: string
          updated_at?: string
          vaccination_date: string
          vaccine_name: string
        }
        Update: {
          administered_by_name?: string | null
          batch_number?: string | null
          created_at?: string
          id?: string
          livestock_id?: string
          next_due_date?: string | null
          notes?: string | null
          owner_id?: string
          updated_at?: string
          vaccination_date?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_livestock_owner_fk"
            columns: ["livestock_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      vet_verifications: {
        Row: {
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["vet_verification_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vet_verification_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["vet_verification_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          farm_size: string | null
          full_name: string
          id: string
          livestock_types: string[]
          location: string
          phone: string | null
          preferred_language: string
          user_type: string
        }
        Insert: {
          created_at?: string
          email: string
          farm_size?: string | null
          full_name: string
          id?: string
          livestock_types: string[]
          location: string
          phone?: string | null
          preferred_language: string
          user_type: string
        }
        Update: {
          created_at?: string
          email?: string
          farm_size?: string | null
          full_name?: string
          id?: string
          livestock_types?: string[]
          location?: string
          phone?: string | null
          preferred_language?: string
          user_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      farm_today: { Args: never; Returns: string }
      farmer_reminders: {
        Args: { _horizon?: number; _today: string }
        Returns: {
          due_date: string
          identification_code: string
          kind: string
          label: string
          livestock_id: string
          livestock_name: string
          quantity: number
          record_id: string
          record_type: string
          species: string
          treatment_status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      health_summary: {
        Args: { _today: string }
        Returns: {
          due_today: number
          health_events: number
          overdue: number
          upcoming: number
          vaccination_records: number
        }[]
      }
      livestock_summary: {
        Args: never
        Returns: {
          active_records: number
          animals_in_groups: number
          archived_records: number
          group_records: number
          individual_records: number
          total_animals: number
        }[]
      }
      review_vet: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["vet_verification_status"]
          _vet_id: string
        }
        Returns: undefined
      }
      treatment_count: { Args: never; Returns: number }
      vaccine_key: { Args: { _name: string }; Returns: string }
    }
    Enums: {
      app_role: "farmer" | "vet" | "admin" | "content_editor" | "super_admin"
      vet_verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["farmer", "vet", "admin", "content_editor", "super_admin"],
      vet_verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
