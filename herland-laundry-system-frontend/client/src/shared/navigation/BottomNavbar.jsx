import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRoleNavigation } from './navItems';
import { supabase } from '../../lib/supabase';

export default function BottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Globally block BottomNavbar from pages where it doesn't belong
  const isSetupRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/book');
  if (isSetupRoute) return null;

  // Render this simplified CTA exclusively on allowed landing/dashboard paths
  const isCustomerDashboard = location.pathname === '/dashboard' || location.pathname === '/user';
  const isPublicLanding = location.pathname === '/' || location.pathname === '/landing' || location.pathname === '/guest';

  if (!isCustomerDashboard && !isPublicLanding) return null;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden shadow-[0_-20px_40px_rgba(255,255,255,0.9)] bg-gradient-to-t from-white via-white to-transparent pt-8 pointer-events-none">
      <div className="mx-auto w-full max-w-md pointer-events-auto">
        <button
          onClick={() => navigate('/book')}
          className="w-full flex items-center justify-center gap-2 bg-[#4bad40] hover:bg-[#3f9136] text-white py-4 px-6 shadow-xl shadow-[#4bad40]/40 rounded-2xl text-lg font-bold transition-transform hover:-translate-y-1 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Book Now
        </button>
      </div>
    </div>
  );
}
