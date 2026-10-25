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
      care_administrations: {
        Row: {
          administered_by: string
          administration_date: string
          created_at: string
          farmer_id: string
          id: string
          notes: string
          prescription_id: string
        }
        Insert: {
          administered_by: string
          administration_date: string
          created_at?: string
          farmer_id: string
          id?: string
          notes: string
          prescription_id: string
        }
        Update: {
          administered_by?: string
          administration_date?: string
          created_at?: string
          farmer_id?: string
          id?: string
          notes?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_administrations_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_administrations_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "care_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      care_ai_requests: {
        Row: {
          consent_at: string
          created_at: string
          farmer_id: string
          id: string
          language: string
          livestock_id: string
          response: string | null
          status: string
          symptoms: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          farmer_id: string
          id?: string
          language: string
          livestock_id: string
          response?: string | null
          status?: string
          symptoms: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          farmer_id?: string
          id?: string
          language?: string
          livestock_id?: string
          response?: string | null
          status?: string
          symptoms?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_ai_requests_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_ai_requests_livestock_id_farmer_id_fkey"
            columns: ["livestock_id", "farmer_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      care_ai_service_state: {
        Row: {
          id: string
          paused: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          id: string
          paused?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          paused?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      care_appointments: {
        Row: {
          consultation_type: string
          created_at: string
          currency: string | null
          ends_at: string
          farmer_id: string
          farmer_name: string
          fee: number | null
          id: string
          livestock_id: string
          location: string
          reason: string
          slot_id: string
          starts_at: string
          status: string
          updated_at: string
          vet_id: string
          vet_name: string
        }
        Insert: {
          consultation_type: string
          created_at?: string
          currency?: string | null
          ends_at: string
          farmer_id: string
          farmer_name: string
          fee?: number | null
          id?: string
          livestock_id: string
          location: string
          reason: string
          slot_id: string
          starts_at: string
          status?: string
          updated_at?: string
          vet_id: string
          vet_name: string
        }
        Update: {
          consultation_type?: string
          created_at?: string
          currency?: string | null
          ends_at?: string
          farmer_id?: string
          farmer_name?: string
          fee?: number | null
          id?: string
          livestock_id?: string
          location?: string
          reason?: string
          slot_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          vet_id?: string
          vet_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_appointments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_appointments_livestock_id_farmer_id_fkey"
            columns: ["livestock_id", "farmer_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "care_appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "care_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_appointments_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          farmer_id: string
          id: string
          livestock_id: string
          record_id: string
          vet_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          farmer_id: string
          id?: string
          livestock_id: string
          record_id: string
          vet_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          farmer_id?: string
          id?: string
          livestock_id?: string
          record_id?: string
          vet_id?: string
        }
        Relationships: []
      }
      care_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_consultations: {
        Row: {
          appointment_id: string
          assessment: string
          author_id: string
          created_at: string
          farmer_report: string
          follow_up_date: string | null
          id: string
          recommendations: string
          supersedes_id: string | null
        }
        Insert: {
          appointment_id: string
          assessment: string
          author_id: string
          created_at?: string
          farmer_report: string
          follow_up_date?: string | null
          id?: string
          recommendations: string
          supersedes_id?: string | null
        }
        Update: {
          appointment_id?: string
          assessment?: string
          author_id?: string
          created_at?: string
          farmer_report?: string
          follow_up_date?: string | null
          id?: string
          recommendations?: string
          supersedes_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_consultations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_consultations_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: true
            referencedRelation: "care_consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      care_messages: {
        Row: {
          appointment_id: string
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          appointment_id: string
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          appointment_id?: string
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_prescriptions: {
        Row: {
          appointment_id: string
          author_id: string
          consultation_id: string
          dose: string
          duration: string
          frequency: string
          id: string
          instructions: string
          issued_at: string
          licence: string
          medicine: string
          qualifications: string
          route: string
          supersedes_id: string | null
          vet_name: string
          withdrawal_guidance: string
        }
        Insert: {
          appointment_id: string
          author_id: string
          consultation_id: string
          dose: string
          duration: string
          frequency: string
          id?: string
          instructions: string
          issued_at?: string
          licence: string
          medicine: string
          qualifications: string
          route: string
          supersedes_id?: string | null
          vet_name: string
          withdrawal_guidance: string
        }
        Update: {
          appointment_id?: string
          author_id?: string
          consultation_id?: string
          dose?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string
          issued_at?: string
          licence?: string
          medicine?: string
          qualifications?: string
          route?: string
          supersedes_id?: string | null
          vet_name?: string
          withdrawal_guidance?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_prescriptions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "care_consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_prescriptions_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: true
            referencedRelation: "care_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      care_reports: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          farmer_id: string
          id: string
          livestock_id: string
          revoked_at: string | null
          scopes: string[]
          vet_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          farmer_id: string
          id?: string
          livestock_id: string
          revoked_at?: string | null
          scopes: string[]
          vet_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          farmer_id?: string
          id?: string
          livestock_id?: string
          revoked_at?: string | null
          scopes?: string[]
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_shares_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_shares_livestock_id_farmer_id_fkey"
            columns: ["livestock_id", "farmer_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "care_shares_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_slots: {
        Row: {
          consultation_type: string
          created_at: string
          ends_at: string
          id: string
          location: string
          published: boolean
          starts_at: string
          vet_id: string
        }
        Insert: {
          consultation_type: string
          created_at?: string
          ends_at: string
          id?: string
          location?: string
          published?: boolean
          starts_at: string
          vet_id: string
        }
        Update: {
          consultation_type?: string
          created_at?: string
          ends_at?: string
          id?: string
          location?: string
          published?: boolean
          starts_at?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_slots_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_video_rooms: {
        Row: {
          appointment_id: string
          expires_at: string
          room_name: string
          room_url: string
        }
        Insert: {
          appointment_id: string
          expires_at: string
          room_name: string
          room_url: string
        }
        Update: {
          appointment_id?: string
          expires_at?: string
          room_name?: string
          room_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_video_rooms_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "care_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      vet_public_profiles: {
        Row: {
          biography: string
          consultation_types: string[]
          currency: string | null
          display_name: string
          fee: number | null
          languages: string[]
          licence: string
          location: string
          published: boolean
          qualifications: string
          specialties: string[]
          species: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          biography?: string
          consultation_types?: string[]
          currency?: string | null
          display_name: string
          fee?: number | null
          languages?: string[]
          licence?: string
          location?: string
          published?: boolean
          qualifications?: string
          specialties?: string[]
          species?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          biography?: string
          consultation_types?: string[]
          currency?: string | null
          display_name?: string
          fee?: number | null
          languages?: string[]
          licence?: string
          location?: string
          published?: boolean
          qualifications?: string
          specialties?: string[]
          species?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_public_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      care_book: {
        Args: { _livestock: string; _reason: string; _slot: string }
        Returns: string
      }
      care_can_access: { Args: { _appointment: string }; Returns: boolean }
      care_clinical_author: { Args: { _id: string }; Returns: boolean }
      care_followup_notifications: { Args: never; Returns: undefined }
      care_has_share: {
        Args: {
          _farmer: string
          _livestock: string
          _scope?: string
          _vet: string
        }
        Returns: boolean
      }
      care_issue_prescription: {
        Args: {
          _appointment: string
          _confirmed: boolean
          _consultation: string
          _dose: string
          _duration: string
          _frequency: string
          _instructions: string
          _medicine: string
          _route: string
          _supersedes?: string
          _withdrawal: string
        }
        Returns: string
      }
      care_not_blocked: { Args: { _a: string; _b: string }; Returns: boolean }
      care_publish_prescription: {
        Args: {
          _appointment: string
          _confirmed: boolean
          _consultation: string
          _dose: string
          _duration: string
          _frequency: string
          _instructions: string
          _medicine: string
          _route: string
          _supersedes?: string
          _withdrawal: string
        }
        Returns: string
      }
      care_read_messages: { Args: { _appointment: string }; Returns: undefined }
      care_record_administration: {
        Args: {
          _by: string
          _date: string
          _notes: string
          _prescription: string
        }
        Returns: string
      }
      care_report_metadata: {
        Args: never
        Returns: {
          created_at: string
          id: string
          reported_id: string
          reporter_id: string
          status: string
        }[]
      }
      care_required_confirmation: {
        Args: { _confirmed: boolean }
        Returns: boolean
      }
      care_reschedule: { Args: { _id: string; _slot: string }; Returns: string }
      care_review_report: { Args: { _id: string }; Returns: undefined }
      care_save_consultation: {
        Args: {
          _appointment: string
          _assessment: string
          _follow_up?: string
          _recommendations: string
          _report: string
          _supersedes?: string
        }
        Returns: string
      }
      care_send_message: {
        Args: { _appointment: string; _body: string }
        Returns: string
      }
      care_set_share: {
        Args: {
          _expires?: string
          _livestock: string
          _revoke?: boolean
          _scopes: string[]
          _vet: string
        }
        Returns: string
      }
      care_shared_records: {
        Args: { _farmer: string; _livestock: string }
        Returns: Json
      }
      care_transition: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
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
      is_approved_vet: { Args: { _vet: string }; Returns: boolean }
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
