export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          title: string
          user_id: string
          is_archived: boolean
          is_published: boolean
          parent_id: string | null
          content: Json | null
          cover_image: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          user_id: string
          is_archived?: boolean
          is_published?: boolean
          parent_id?: string | null
          content?: Json | null
          cover_image?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          is_archived?: boolean
          is_published?: boolean
          parent_id?: string | null
          content?: Json | null
          cover_image?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
} 