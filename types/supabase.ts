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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
