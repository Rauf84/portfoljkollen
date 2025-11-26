import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase } from '../supabaseClient';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      // Demo-session så att appen är fullt synlig utan Supabase-konfiguration
      const demoSession: Session = {
        access_token: 'demo-token',
        refresh_token: null,
        provider_token: null,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: 'demo-user',
          app_metadata: { provider: 'demo' },
          user_metadata: { name: 'Demoanvändare' },
          aud: 'authenticated',
          role: 'authenticated',
          email: 'demo@portfoljkollen.local',
          created_at: new Date().toISOString(),
          factors: []
        }
      };

      setSession(demoSession);
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, demoMode: !hasSupabaseConfig };
}
