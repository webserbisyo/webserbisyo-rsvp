export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          client_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_id: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
      client_deletion_tombstones: {
        Row: {
          client_email: string;
          client_name: string;
          client_status: string | null;
          deleted_at: string;
          deleted_by: string | null;
          deleted_reason: string | null;
          event_date: string | null;
          event_id: string | null;
          event_slug: string | null;
          event_type: string | null;
          id: string;
          metadata: Json;
          original_client_id: string | null;
          payment_status: string | null;
          payment_summary: Json;
        };
        Insert: {
          client_email: string;
          client_name: string;
          client_status?: string | null;
          deleted_at?: string;
          deleted_by?: string | null;
          deleted_reason?: string | null;
          event_date?: string | null;
          event_id?: string | null;
          event_slug?: string | null;
          event_type?: string | null;
          id?: string;
          metadata?: Json;
          original_client_id?: string | null;
          payment_status?: string | null;
          payment_summary?: Json;
        };
        Update: {
          client_email?: string;
          client_name?: string;
          client_status?: string | null;
          deleted_at?: string;
          deleted_by?: string | null;
          deleted_reason?: string | null;
          event_date?: string | null;
          event_id?: string | null;
          event_slug?: string | null;
          event_type?: string | null;
          id?: string;
          metadata?: Json;
          original_client_id?: string | null;
          payment_status?: string | null;
          payment_summary?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "client_deletion_tombstones_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          archived_at: string | null;
          cancelled_at: string | null;
          contact_email: string;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          custom_frontend_status: string;
          custom_frontend_url: string | null;
          hosting_ends_at: string | null;
          hosting_starts_at: string | null;
          id: string;
          last_activity_at: string;
          name: string;
          notes: string | null;
          plan_type: string;
          renewal_required_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          cancelled_at?: string | null;
          contact_email: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          custom_frontend_status?: string;
          custom_frontend_url?: string | null;
          hosting_ends_at?: string | null;
          hosting_starts_at?: string | null;
          id?: string;
          last_activity_at?: string;
          name: string;
          notes?: string | null;
          plan_type: string;
          renewal_required_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          cancelled_at?: string | null;
          contact_email?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          custom_frontend_status?: string;
          custom_frontend_url?: string | null;
          hosting_ends_at?: string | null;
          hosting_starts_at?: string | null;
          id?: string;
          last_activity_at?: string;
          name?: string;
          notes?: string | null;
          plan_type?: string;
          renewal_required_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          application_id: string | null;
          client_id: string | null;
          created_at: string;
          email_type: string;
          error_message: string | null;
          event_id: string | null;
          id: string;
          provider: string;
          provider_message_id: string | null;
          recipient_email: string;
          recipient_name: string | null;
          sent_at: string | null;
          status: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          application_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          email_type: string;
          error_message?: string | null;
          event_id?: string | null;
          id?: string;
          provider?: string;
          provider_message_id?: string | null;
          recipient_email: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          application_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          email_type?: string;
          error_message?: string | null;
          event_id?: string | null;
          id?: string;
          provider?: string;
          provider_message_id?: string | null;
          recipient_email?: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_content: {
        Row: {
          contact_note: string | null;
          content_json: Json;
          couple_or_celebrant_names: string | null;
          created_at: string;
          dress_code: string | null;
          event_id: string;
          event_story: string | null;
          gift_note: string | null;
          hero_subtitle: string | null;
          hero_title: string | null;
          id: string;
          published_at: string | null;
          published_by: string | null;
          published_content_json: Json | null;
          rsvp_note: string | null;
          schedule_note: string | null;
          theme_key: string | null;
          updated_at: string;
          venue_note: string | null;
        };
        Insert: {
          contact_note?: string | null;
          content_json?: Json;
          couple_or_celebrant_names?: string | null;
          created_at?: string;
          dress_code?: string | null;
          event_id: string;
          event_story?: string | null;
          gift_note?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          published_at?: string | null;
          published_by?: string | null;
          published_content_json?: Json | null;
          rsvp_note?: string | null;
          schedule_note?: string | null;
          theme_key?: string | null;
          updated_at?: string;
          venue_note?: string | null;
        };
        Update: {
          contact_note?: string | null;
          content_json?: Json;
          couple_or_celebrant_names?: string | null;
          created_at?: string;
          dress_code?: string | null;
          event_id?: string;
          event_story?: string | null;
          gift_note?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: string;
          published_at?: string | null;
          published_by?: string | null;
          published_content_json?: Json | null;
          rsvp_note?: string | null;
          schedule_note?: string | null;
          theme_key?: string | null;
          updated_at?: string;
          venue_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_content_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_content_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meta_pixels: {
        Row: {
          access_token_encrypted: string | null;
          client_id: string | null;
          created_at: string;
          event_id: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          pixel_id: string;
          tracking_scope: string;
          updated_at: string;
        };
        Insert: {
          access_token_encrypted?: string | null;
          client_id?: string | null;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          pixel_id: string;
          tracking_scope?: string;
          updated_at?: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          client_id?: string | null;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          pixel_id?: string;
          tracking_scope?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meta_pixels_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meta_pixels_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_refunds: {
        Row: {
          amount: number;
          client_id: string | null;
          confirmed_at: string;
          created_at: string;
          created_by: string | null;
          id: string;
          metadata: Json;
          method: string | null;
          payment_id: string;
          reason_note: string | null;
          reference_number: string | null;
        };
        Insert: {
          amount: number;
          client_id?: string | null;
          confirmed_at: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          metadata?: Json;
          method?: string | null;
          payment_id: string;
          reason_note?: string | null;
          reference_number?: string | null;
        };
        Update: {
          amount?: number;
          client_id?: string | null;
          confirmed_at?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          metadata?: Json;
          method?: string | null;
          payment_id?: string;
          reason_note?: string | null;
          reference_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payment_refunds_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_refunds_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_refunds_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_due: number;
          amount_paid: number;
          application_id: string;
          client_id: string | null;
          confirmed_by: string | null;
          created_at: string;
          currency: string;
          event_id: string | null;
          hosting_ends_at: string | null;
          hosting_starts_at: string | null;
          id: string;
          notes: string | null;
          paid_at: string | null;
          payment_method: string | null;
          payment_status: string;
          plan_type: string;
          reference_number: string | null;
          renewal_required_at: string | null;
          updated_at: string;
        };
        Insert: {
          amount_due: number;
          amount_paid?: number;
          application_id: string;
          client_id?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          currency?: string;
          event_id?: string | null;
          hosting_ends_at?: string | null;
          hosting_starts_at?: string | null;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          plan_type: string;
          reference_number?: string | null;
          renewal_required_at?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_due?: number;
          amount_paid?: number;
          application_id?: string;
          client_id?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          currency?: string;
          event_id?: string | null;
          hosting_ends_at?: string | null;
          hosting_starts_at?: string | null;
          id?: string;
          notes?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_status?: string;
          plan_type?: string;
          reference_number?: string | null;
          renewal_required_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_package_settings: {
        Row: {
          created_at: string;
          currency: string;
          default_amount: number | null;
          default_hosting_days: number | null;
          id: string;
          is_active: boolean;
          plan_type: string;
          renewal_notice_days: number | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          default_amount?: number | null;
          default_hosting_days?: number | null;
          id?: string;
          is_active?: boolean;
          plan_type: string;
          renewal_notice_days?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          currency?: string;
          default_amount?: number | null;
          default_hosting_days?: number | null;
          id?: string;
          is_active?: boolean;
          plan_type?: string;
          renewal_notice_days?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_package_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_payment_options: {
        Row: {
          account_name: string | null;
          account_number: string | null;
          created_at: string;
          id: string;
          is_enabled: boolean;
          provider: string;
          qr_image_path: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          account_name?: string | null;
          account_number?: string | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          provider: string;
          qr_image_path?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          account_name?: string | null;
          account_number?: string | null;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          provider?: string;
          qr_image_path?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_payment_options_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_public_settings: {
        Row: {
          created_at: string;
          id: string;
          messenger_page_url: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          messenger_page_url?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          messenger_page_url?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_public_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          client_id: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          is_active: boolean;
          role: string;
          updated_at: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          role: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvp_applications: {
        Row: {
          approved_at: string | null;
          approved_client_id: string | null;
          approved_event_id: string | null;
          created_at: string;
          email: string;
          estimated_guest_count: number | null;
          event_date: string | null;
          event_location: string | null;
          event_type: string;
          full_name: string;
          id: string;
          message: string | null;
          phone: string | null;
          preferred_manual_payment_option: string | null;
          preferred_plan: string;
          reference_code: string;
          rejected_at: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          status: string;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_client_id?: string | null;
          approved_event_id?: string | null;
          created_at?: string;
          email: string;
          estimated_guest_count?: number | null;
          event_date?: string | null;
          event_location?: string | null;
          event_type: string;
          full_name: string;
          id?: string;
          message?: string | null;
          phone?: string | null;
          preferred_manual_payment_option?: string | null;
          preferred_plan: string;
          reference_code: string;
          rejected_at?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          status?: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_client_id?: string | null;
          approved_event_id?: string | null;
          created_at?: string;
          email?: string;
          estimated_guest_count?: number | null;
          event_date?: string | null;
          event_location?: string | null;
          event_type?: string;
          full_name?: string;
          id?: string;
          message?: string | null;
          phone?: string | null;
          preferred_manual_payment_option?: string | null;
          preferred_plan?: string;
          reference_code?: string;
          rejected_at?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          status?: string;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_applications_approved_client_id_fkey";
            columns: ["approved_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rsvp_applications_approved_event_id_fkey";
            columns: ["approved_event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvp_events: {
        Row: {
          archived_at: string | null;
          client_id: string;
          created_at: string;
          custom_frontend_enabled: boolean;
          custom_frontend_url: string | null;
          draft_event_slug: string;
          draft_subdomain_slug: string | null;
          draft_visibility: string;
          event_date: string | null;
          event_slug: string;
          event_time: string | null;
          event_type: string;
          fallback_page_enabled: boolean;
          id: string;
          max_guest_count: number | null;
          published_at: string | null;
          rsvp_close_at: string | null;
          rsvp_open_at: string | null;
          status: string;
          subdomain_slug: string | null;
          title: string;
          updated_at: string;
          venue_address: string | null;
          venue_name: string | null;
          visibility: string;
          website_access_updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          client_id: string;
          created_at?: string;
          custom_frontend_enabled?: boolean;
          custom_frontend_url?: string | null;
          draft_event_slug?: string;
          draft_subdomain_slug?: string | null;
          draft_visibility?: string;
          event_date?: string | null;
          event_slug: string;
          event_time?: string | null;
          event_type: string;
          fallback_page_enabled?: boolean;
          id?: string;
          max_guest_count?: number | null;
          published_at?: string | null;
          rsvp_close_at?: string | null;
          rsvp_open_at?: string | null;
          status?: string;
          subdomain_slug?: string | null;
          title: string;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
          visibility?: string;
          website_access_updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          client_id?: string;
          created_at?: string;
          custom_frontend_enabled?: boolean;
          custom_frontend_url?: string | null;
          draft_event_slug?: string;
          draft_subdomain_slug?: string | null;
          draft_visibility?: string;
          event_date?: string | null;
          event_slug?: string;
          event_time?: string | null;
          event_type?: string;
          fallback_page_enabled?: boolean;
          id?: string;
          max_guest_count?: number | null;
          published_at?: string | null;
          rsvp_close_at?: string | null;
          rsvp_open_at?: string | null;
          status?: string;
          subdomain_slug?: string | null;
          title?: string;
          updated_at?: string;
          venue_address?: string | null;
          venue_name?: string | null;
          visibility?: string;
          website_access_updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvp_response_companions: {
        Row: {
          age_label: string | null;
          created_at: string;
          full_name: string;
          id: string;
          response_id: string;
        };
        Insert: {
          age_label?: string | null;
          created_at?: string;
          full_name: string;
          id?: string;
          response_id: string;
        };
        Update: {
          age_label?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          response_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_response_companions_response_id_fkey";
            columns: ["response_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_responses";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvp_responses: {
        Row: {
          archived_at: string | null;
          attendance_status: string;
          client_id: string;
          dietary_notes: string | null;
          email: string | null;
          event_id: string;
          guest_name: string;
          id: string;
          message: string | null;
          party_size: number;
          phone: string | null;
          source: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          attendance_status: string;
          client_id: string;
          dietary_notes?: string | null;
          email?: string | null;
          event_id: string;
          guest_name: string;
          id?: string;
          message?: string | null;
          party_size?: number;
          phone?: string | null;
          source?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          attendance_status?: string;
          client_id?: string;
          dietary_notes?: string | null;
          email?: string | null;
          event_id?: string;
          guest_name?: string;
          id?: string;
          message?: string | null;
          party_size?: number;
          phone?: string | null;
          source?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rsvp_responses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "rsvp_events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
