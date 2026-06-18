import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { attachFetchInterceptor } from '../lib/fetchInterceptor';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({
  session: null,
  activeRole: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [activeRole, setActiveRole] = useState(() => window.sessionStorage.getItem('activeRole'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    window.sessionStorage.removeItem('activeRole');
    setActiveRole(null);
    setSession(null);
    await supabase.auth.signOut().catch(() => {});
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    // Attach global fetch interceptor safely
    attachFetchInterceptor(() => {
      // Callback when 401 occurs
      handleSignOut();
    });

    const syncSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error.message);
        if (error.message.includes('Refresh Token') || error.message.includes('refresh token')) {
          await handleSignOut();
          return;
        }
      }

      if (session) {
        setSession(session);
        let role = window.sessionStorage.getItem('activeRole');

        // Fetch role from profiles if not in sessionStorage
        if (!role) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          role = profile?.role || 'Customer';
          window.sessionStorage.setItem('activeRole', role);
          setActiveRole(role);
        } else {
          setActiveRole(role);
        }
      } else {
        setSession(null);
        window.sessionStorage.removeItem('activeRole');
        setActiveRole(null);
      }
      setLoading(false);
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.sessionStorage.removeItem('activeRole');
        setActiveRole(null);
        setSession(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        syncSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ session, activeRole, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
