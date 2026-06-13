/**
 * Database types for Supabase.
 *
 * Regenerate with the Supabase CLI once the project is linked:
 *   npx supabase gen types typescript --project-id <id> --schema public > types/supabase.ts
 *
 * Until then, this file is maintained by hand and only covers tables that
 * already exist in the remote project.
 */

export interface Database {
  public: {
    Tables: {
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          user_agent: string | null;
          created_at: string;
          confirmation_token: string | null;
          confirmed_at: string | null;
          confirmation_sent_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string | null;
          user_agent?: string | null;
          created_at?: string;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          confirmation_sent_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          source?: string | null;
          user_agent?: string | null;
          created_at?: string;
          confirmation_token?: string | null;
          confirmed_at?: string | null;
          confirmation_sent_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          topic: string;
          audience: string | null;
          author: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          topic: string;
          audience?: string | null;
          author?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          topic?: string;
          audience?: string | null;
          author?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          id: string;
          project_id: string;
          position: number;
          heading: string;
          summary: string | null;
          content: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          position: number;
          heading: string;
          summary?: string | null;
          content?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          position?: number;
          heading?: string;
          summary?: string | null;
          content?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      kdp_listings: {
        Row: {
          project_id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          keywords: string[] | null;
          categories: string[] | null;
          price_eur: number | null;
          price_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          title?: string | null;
          subtitle?: string | null;
          description?: string | null;
          keywords?: string[] | null;
          categories?: string[] | null;
          price_eur?: number | null;
          price_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          title?: string | null;
          subtitle?: string | null;
          description?: string | null;
          keywords?: string[] | null;
          categories?: string[] | null;
          price_eur?: number | null;
          price_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kdp_listings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: true;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      covers: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          image_url: string;
          prompt: string | null;
          model: string | null;
          is_selected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          image_url: string;
          prompt?: string | null;
          model?: string | null;
          is_selected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          storage_path?: string;
          image_url?: string;
          prompt?: string | null;
          model?: string | null;
          is_selected?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "covers_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
