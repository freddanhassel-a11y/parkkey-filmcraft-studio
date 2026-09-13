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
      assets: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          tags: string[]
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          tags?: string[]
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          tags?: string[]
          url?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          created_at: string
          detail: Json
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          created_at?: string
          detail?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      coreos_material_links: {
        Row: {
          coreos_activity_id: string | null
          coreos_entity_id: string
          coreos_entity_type: string
          coreos_material_id: string | null
          created_at: string
          created_by: string | null
          direction: string
          display_name: string
          error_message: string | null
          film_project_id: string | null
          film_version_id: string | null
          id: string
          media_asset_id: string | null
          preview_reference: string | null
          status: string
          truth_label: string
        }
        Insert: {
          coreos_activity_id?: string | null
          coreos_entity_id: string
          coreos_entity_type: string
          coreos_material_id?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          display_name: string
          error_message?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          id?: string
          media_asset_id?: string | null
          preview_reference?: string | null
          status?: string
          truth_label?: string
        }
        Update: {
          coreos_activity_id?: string | null
          coreos_entity_id?: string
          coreos_entity_type?: string
          coreos_material_id?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          display_name?: string
          error_message?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          id?: string
          media_asset_id?: string | null
          preview_reference?: string | null
          status?: string
          truth_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "coreos_material_links_film_project_id_fkey"
            columns: ["film_project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coreos_material_links_film_version_id_fkey"
            columns: ["film_version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coreos_material_links_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_material_links: {
        Row: {
          approved_cta: string | null
          coreos_entity_id: string
          coreos_entity_type: string
          created_at: string
          created_by: string | null
          display_meta: Json
          display_name: string
          due_date: string | null
          film_project_id: string | null
          id: string
          media_asset_id: string | null
          notes: string | null
          requested_asset: string | null
          truth_label: string
          updated_at: string
        }
        Insert: {
          approved_cta?: string | null
          coreos_entity_id: string
          coreos_entity_type: string
          created_at?: string
          created_by?: string | null
          display_meta?: Json
          display_name: string
          due_date?: string | null
          film_project_id?: string | null
          id?: string
          media_asset_id?: string | null
          notes?: string | null
          requested_asset?: string | null
          truth_label?: string
          updated_at?: string
        }
        Update: {
          approved_cta?: string | null
          coreos_entity_id?: string
          coreos_entity_type?: string
          created_at?: string
          created_by?: string | null
          display_meta?: Json
          display_name?: string
          due_date?: string | null
          film_project_id?: string | null
          id?: string
          media_asset_id?: string | null
          notes?: string | null
          requested_asset?: string | null
          truth_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_material_links_film_project_id_fkey"
            columns: ["film_project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_material_links_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_packages: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          coreos_display_name: string | null
          coreos_entity_id: string | null
          coreos_entity_type: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          film_project_id: string | null
          film_version_id: string | null
          id: string
          media_asset_id: string | null
          message: string | null
          secure_reference: string | null
          social_post_id: string | null
          status: string
          subject: string | null
          title: string
          truth_label: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          coreos_display_name?: string | null
          coreos_entity_id?: string | null
          coreos_entity_type?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          id?: string
          media_asset_id?: string | null
          message?: string | null
          secure_reference?: string | null
          social_post_id?: string | null
          status?: string
          subject?: string | null
          title: string
          truth_label?: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          coreos_display_name?: string | null
          coreos_entity_id?: string | null
          coreos_entity_type?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          id?: string
          media_asset_id?: string | null
          message?: string | null
          secure_reference?: string | null
          social_post_id?: string | null
          status?: string
          subject?: string | null
          title?: string
          truth_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_packages_film_project_id_fkey"
            columns: ["film_project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_film_version_id_fkey"
            columns: ["film_version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_recipients: {
        Row: {
          coreos_contact_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          package_id: string
          role_note: string | null
        }
        Insert: {
          coreos_contact_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          package_id: string
          role_note?: string | null
        }
        Update: {
          coreos_contact_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          package_id?: string
          role_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_recipients_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "delivery_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      film_projects: {
        Row: {
          aspect_ratio: string
          audience: string | null
          campaign: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          cta: string | null
          device_interaction: string | null
          duration_seconds: number
          fps: number
          goal: string | null
          id: string
          is_favorite: boolean
          location_time: string | null
          music_direction: string | null
          notes: string | null
          parky_usage: string | null
          poster_url: string | null
          reference_media: string | null
          resolution: string
          sfx_enabled: boolean
          status: string
          subtitles_enabled: boolean
          tags: string[]
          title: string
          truth_label: string
          updated_at: string
          visual_mood: string | null
          voice_enabled: boolean
        }
        Insert: {
          aspect_ratio?: string
          audience?: string | null
          campaign?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          cta?: string | null
          device_interaction?: string | null
          duration_seconds?: number
          fps?: number
          goal?: string | null
          id?: string
          is_favorite?: boolean
          location_time?: string | null
          music_direction?: string | null
          notes?: string | null
          parky_usage?: string | null
          poster_url?: string | null
          reference_media?: string | null
          resolution?: string
          sfx_enabled?: boolean
          status?: string
          subtitles_enabled?: boolean
          tags?: string[]
          title: string
          truth_label?: string
          updated_at?: string
          visual_mood?: string | null
          voice_enabled?: boolean
        }
        Update: {
          aspect_ratio?: string
          audience?: string | null
          campaign?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          cta?: string | null
          device_interaction?: string | null
          duration_seconds?: number
          fps?: number
          goal?: string | null
          id?: string
          is_favorite?: boolean
          location_time?: string | null
          music_direction?: string | null
          notes?: string | null
          parky_usage?: string | null
          poster_url?: string | null
          reference_media?: string | null
          resolution?: string
          sfx_enabled?: boolean
          status?: string
          subtitles_enabled?: boolean
          tags?: string[]
          title?: string
          truth_label?: string
          updated_at?: string
          visual_mood?: string | null
          voice_enabled?: boolean
        }
        Relationships: []
      }
      film_versions: {
        Row: {
          changelog: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          status: string
          updated_at: string
          version_label: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          status?: string
          updated_at?: string
          version_label?: string
        }
        Update: {
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          status?: string
          updated_at?: string
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "film_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          capability: string | null
          config: Json
          created_at: string
          display_name: string
          id: string
          notes: string | null
          provider: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          capability?: string | null
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          notes?: string | null
          provider: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          capability?: string | null
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          notes?: string | null
          provider?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          capability: string | null
          created_at: string
          display_name: string
          id: string
          notes: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          capability?: string | null
          created_at?: string
          display_name: string
          id?: string
          notes?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          capability?: string | null
          created_at?: string
          display_name?: string
          id?: string
          notes?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          approval_status: string
          archived_at: string | null
          campaign: string | null
          category: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_size: number | null
          film_project_id: string | null
          height: number | null
          id: string
          kind: string
          mime_type: string | null
          name: string
          notes: string | null
          source_notes: string | null
          storage_path: string | null
          tags: string[]
          updated_at: string
          usage_rights: string | null
          width: number | null
        }
        Insert: {
          approval_status?: string
          archived_at?: string | null
          campaign?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          film_project_id?: string | null
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          name: string
          notes?: string | null
          source_notes?: string | null
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          usage_rights?: string | null
          width?: number | null
        }
        Update: {
          approval_status?: string
          archived_at?: string | null
          campaign?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          film_project_id?: string | null
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          name?: string
          notes?: string | null
          source_notes?: string | null
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          usage_rights?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_film_project_id_fkey"
            columns: ["film_project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      media_versions: {
        Row: {
          approval_status: string
          asset_id: string
          changelog: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          storage_path: string | null
          version_label: string
          width: number | null
        }
        Insert: {
          approval_status?: string
          asset_id: string
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string | null
          version_label?: string
          width?: number | null
        }
        Update: {
          approval_status?: string
          asset_id?: string
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string | null
          version_label?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_builtin: boolean
          name: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_builtin?: boolean
          name: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_builtin?: boolean
          name?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          kind: string
          project_id: string
          title: string
          version_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          project_id: string
          title: string
          version_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          project_id?: string
          title?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_attempts: {
        Row: {
          attempted_by: string | null
          created_at: string
          error_message: string | null
          id: string
          post_id: string
          provider: string
          provider_post_url: string | null
          schedule_id: string | null
          status: string
        }
        Insert: {
          attempted_by?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          post_id: string
          provider?: string
          provider_post_url?: string | null
          schedule_id?: string | null
          status?: string
        }
        Update: {
          attempted_by?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          post_id?: string
          provider?: string
          provider_post_url?: string | null
          schedule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_attempts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_attempts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "social_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_checklists: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          items: Json
          passed: boolean
          project_id: string
          updated_at: string
          version_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          passed?: boolean
          project_id: string
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          passed?: boolean
          project_id?: string
          updated_at?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_checklists_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      renders: {
        Row: {
          codec: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          error_message: string | null
          file_url: string | null
          fps: number | null
          height: number | null
          id: string
          mime_type: string | null
          project_id: string
          provider: string
          status: string
          version_id: string | null
          width: number | null
        }
        Insert: {
          codec?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_url?: string | null
          fps?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          project_id: string
          provider?: string
          status?: string
          version_id?: string | null
          width?: number | null
        }
        Update: {
          codec?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          file_url?: string | null
          fps?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          project_id?: string
          provider?: string
          status?: string
          version_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renders_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          media_asset_id: string
          post_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_asset_id: string
          post_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_asset_id?: string
          post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_post_assets_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          alt_text: string | null
          aspect_ratio: string
          audience: string | null
          campaign: string | null
          channel: string | null
          cinematic_mood: string | null
          claim_check: string | null
          copy_direction: string | null
          copy_en: string | null
          copy_sv: string | null
          coreos_display_name: string | null
          coreos_entity_id: string | null
          coreos_entity_type: string | null
          created_at: string
          created_by: string | null
          crop_presets: string[]
          cta: string | null
          film_project_id: string | null
          film_version_id: string | null
          headline: string | null
          id: string
          image_prompt: string | null
          image_references: string | null
          negative_prompt: string | null
          network: string
          objective: string | null
          overlay_copy: string | null
          parky_usage: string | null
          status: string
          tags: string[]
          title: string
          truth_label: string
          updated_at: string
          utm: string | null
        }
        Insert: {
          alt_text?: string | null
          aspect_ratio?: string
          audience?: string | null
          campaign?: string | null
          channel?: string | null
          cinematic_mood?: string | null
          claim_check?: string | null
          copy_direction?: string | null
          copy_en?: string | null
          copy_sv?: string | null
          coreos_display_name?: string | null
          coreos_entity_id?: string | null
          coreos_entity_type?: string | null
          created_at?: string
          created_by?: string | null
          crop_presets?: string[]
          cta?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          headline?: string | null
          id?: string
          image_prompt?: string | null
          image_references?: string | null
          negative_prompt?: string | null
          network?: string
          objective?: string | null
          overlay_copy?: string | null
          parky_usage?: string | null
          status?: string
          tags?: string[]
          title: string
          truth_label?: string
          updated_at?: string
          utm?: string | null
        }
        Update: {
          alt_text?: string | null
          aspect_ratio?: string
          audience?: string | null
          campaign?: string | null
          channel?: string | null
          cinematic_mood?: string | null
          claim_check?: string | null
          copy_direction?: string | null
          copy_en?: string | null
          copy_sv?: string | null
          coreos_display_name?: string | null
          coreos_entity_id?: string | null
          coreos_entity_type?: string | null
          created_at?: string
          created_by?: string | null
          crop_presets?: string[]
          cta?: string | null
          film_project_id?: string | null
          film_version_id?: string | null
          headline?: string | null
          id?: string
          image_prompt?: string | null
          image_references?: string | null
          negative_prompt?: string | null
          network?: string
          objective?: string | null
          overlay_copy?: string | null
          parky_usage?: string | null
          status?: string
          tags?: string[]
          title?: string
          truth_label?: string
          updated_at?: string
          utm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_film_project_id_fkey"
            columns: ["film_project_id"]
            isOneToOne: false
            referencedRelation: "film_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_film_version_id_fkey"
            columns: ["film_version_id"]
            isOneToOne: false
            referencedRelation: "film_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      social_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          post_id: string
          scheduled_at: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          post_id: string
          scheduled_at: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          post_id?: string
          scheduled_at?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_schedules_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
