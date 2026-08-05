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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bridal_dress_appointments: {
        Row: {
          appointment_at: string
          completed: boolean
          created_at: string
          dress_option_id: string | null
          id: string
          location: string | null
          notes: string | null
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          appointment_at: string
          completed?: boolean
          created_at?: string
          dress_option_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          appointment_at?: string
          completed?: boolean
          created_at?: string
          dress_option_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridal_dress_appointments_option_fk"
            columns: ["dress_option_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "bridal_dress_options"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "bridal_dress_appointments_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      bridal_dress_options: {
        Row: {
          atelier_name: string | null
          created_at: string
          estimated_amount: number
          final_amount: number | null
          id: string
          image_url: string | null
          is_favorite: boolean
          notes: string | null
          status: string
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          atelier_name?: string | null
          created_at?: string
          estimated_amount?: number
          final_amount?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          atelier_name?: string | null
          created_at?: string
          estimated_amount?: number
          final_amount?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridal_dress_options_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_installments: {
        Row: {
          amount: number
          budget_item_id: string
          created_at: string
          description: string
          due_date: string
          id: string
          installment_number: number
          notes: string | null
          paid_amount: number
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          amount: number
          budget_item_id: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          amount?: number
          budget_item_id?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installment_number?: number
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_installments_item_fk"
            columns: ["budget_item_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "budget_installments_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          category: string
          contracted_amount: number
          created_at: string
          id: string
          name: string
          notes: string | null
          planned_amount: number
          status: string
          supplier_id: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          category: string
          contracted_amount?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          planned_amount?: number
          status?: string
          supplier_id?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          category?: string
          contracted_amount?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          planned_amount?: number
          status?: string
          supplier_id?: string | null
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
          tone: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
          tone?: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          tone?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_groups_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          group_id: string
          id: string
          priority: string
          responsible_name: string | null
          responsible_type: string
          sort_order: number
          source_id: string | null
          source_type: string
          status: string
          title: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_id: string
          id?: string
          priority?: string
          responsible_name?: string | null
          responsible_type?: string
          sort_order?: number
          source_id?: string | null
          source_type?: string
          status?: string
          title: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          group_id?: string
          id?: string
          priority?: string
          responsible_name?: string | null
          responsible_type?: string
          sort_order?: number
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_tasks_group_fk"
            columns: ["group_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "checklist_groups"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "checklist_tasks_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      convidados: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string | null
          grupo: string | null
          id: string
          nome: string
          observacoes: string | null
          quantidade_acompanhantes: number
          status_confirmacao: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          grupo?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          quantidade_acompanhantes?: number
          status_confirmacao?: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          grupo?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          quantidade_acompanhantes?: number
          status_confirmacao?: string
          telefone?: string | null
        }
        Relationships: []
      }
      guest_table_assignments: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          seat_number: number | null
          table_id: string
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          seat_number?: number | null
          table_id: string
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          seat_number?: number | null
          table_id?: string
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_table_assignments_guest_fk"
            columns: ["guest_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "guest_table_assignments_table_fk"
            columns: ["table_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "seating_tables"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "guest_table_assignments_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          confirmation_status: Database["public"]["Enums"]["guest_confirmation_status"]
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          full_name: string
          id: string
          invitation_group_id: string
          is_child: boolean
          is_primary: boolean
          linked_guest_id: string | null
          notes: string | null
          phone: string | null
          preferred_name: string | null
          relationship_label: string | null
          responded_at: string | null
          side: Database["public"]["Enums"]["guest_side"]
          updated_at: string
          wedding_id: string
        }
        Insert: {
          confirmation_status?: Database["public"]["Enums"]["guest_confirmation_status"]
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name: string
          id?: string
          invitation_group_id: string
          is_child?: boolean
          is_primary?: boolean
          linked_guest_id?: string | null
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          relationship_label?: string | null
          responded_at?: string | null
          side?: Database["public"]["Enums"]["guest_side"]
          updated_at?: string
          wedding_id: string
        }
        Update: {
          confirmation_status?: Database["public"]["Enums"]["guest_confirmation_status"]
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          full_name?: string
          id?: string
          invitation_group_id?: string
          is_child?: boolean
          is_primary?: boolean
          linked_guest_id?: string | null
          notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          relationship_label?: string | null
          responded_at?: string | null
          side?: Database["public"]["Enums"]["guest_side"]
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_group_wedding_fk"
            columns: ["invitation_group_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "invitation_groups"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "guests_linked_guest_wedding_fk"
            columns: ["linked_guest_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "guests_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_groups: {
        Row: {
          city: string | null
          complement: string | null
          created_at: string
          id: string
          invitation_code: string
          name: string
          neighborhood: string | null
          notes: string | null
          postal_code: string | null
          recipient_name: string | null
          save_the_date_status: Database["public"]["Enums"]["save_the_date_status"]
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          wedding_id: string
        }
        Insert: {
          city?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          invitation_code: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          save_the_date_status?: Database["public"]["Enums"]["save_the_date_status"]
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          wedding_id: string
        }
        Update: {
          city?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          invitation_code?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          postal_code?: string | null
          recipient_name?: string | null
          save_the_date_status?: Database["public"]["Enums"]["save_the_date_status"]
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_groups_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          installment_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          installment_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          installment_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attachments_installment_fk"
            columns: ["installment_id", "wedding_id"]
            isOneToOne: false
            referencedRelation: "budget_installments"
            referencedColumns: ["id", "wedding_id"]
          },
          {
            foreignKeyName: "payment_attachments_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          notes: string | null
          position_x: number
          position_y: number
          rotation: number
          shape: string
          sort_order: number
          updated_at: string
          wedding_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          position_x?: number
          position_y?: number
          rotation?: number
          shape?: string
          sort_order?: number
          updated_at?: string
          wedding_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          position_x?: number
          position_y?: number
          rotation?: number
          shape?: string
          sort_order?: number
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seating_tables_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          service_category: string | null
          status: string
          updated_at: string
          website: string | null
          wedding_id: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service_category?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          wedding_id: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service_category?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_members: {
        Row: {
          created_at: string
          id: string
          member_type: Database["public"]["Enums"]["wedding_member_type"]
          role: Database["public"]["Enums"]["wedding_member_role"]
          user_id: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_type?: Database["public"]["Enums"]["wedding_member_type"]
          role?: Database["public"]["Enums"]["wedding_member_role"]
          user_id: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_type?: Database["public"]["Enums"]["wedding_member_type"]
          role?: Database["public"]["Enums"]["wedding_member_role"]
          user_id?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_members_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: false
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_settings: {
        Row: {
          created_at: string
          finance: Json
          gifts: Json
          integrations: Json
          invitation: Json
          notifications: Json
          privacy: Json
          updated_at: string
          wedding_id: string
        }
        Insert: {
          created_at?: string
          finance?: Json
          gifts?: Json
          integrations?: Json
          invitation?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string
          wedding_id: string
        }
        Update: {
          created_at?: string
          finance?: Json
          gifts?: Json
          integrations?: Json
          invitation?: Json
          notifications?: Json
          privacy?: Json
          updated_at?: string
          wedding_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_settings_wedding_id_fkey"
            columns: ["wedding_id"]
            isOneToOne: true
            referencedRelation: "weddings"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          bride_name: string
          created_at: string
          currency: string
          groom_name: string
          id: string
          status: Database["public"]["Enums"]["wedding_status"]
          timezone: string
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          wedding_date: string
          wedding_time: string | null
        }
        Insert: {
          bride_name: string
          created_at?: string
          currency?: string
          groom_name: string
          id?: string
          status?: Database["public"]["Enums"]["wedding_status"]
          timezone?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date: string
          wedding_time?: string | null
        }
        Update: {
          bride_name?: string
          created_at?: string
          currency?: string
          groom_name?: string
          id?: string
          status?: Database["public"]["Enums"]["wedding_status"]
          timezone?: string
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date?: string
          wedding_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_guest_with_primary_transfer: {
        Args: { p_guest_id: string; p_new_primary_guest_id?: string }
        Returns: string
      }
    }
    Enums: {
      guest_confirmation_status: "pending" | "confirmed" | "declined"
      guest_side: "bride" | "groom" | "both"
      save_the_date_status: "not_ready" | "ready" | "sent" | "delivered"
      wedding_member_role: "owner" | "admin" | "viewer"
      wedding_member_type: "bride" | "groom" | "planner" | "developer" | "other"
      wedding_status: "active" | "archived"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      guest_confirmation_status: ["pending", "confirmed", "declined"],
      guest_side: ["bride", "groom", "both"],
      save_the_date_status: ["not_ready", "ready", "sent", "delivered"],
      wedding_member_role: ["owner", "admin", "viewer"],
      wedding_member_type: ["bride", "groom", "planner", "developer", "other"],
      wedding_status: ["active", "archived"],
    },
  },
} as const
