import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRoleNavigation } from './navItems';
import { supabase } from '../../lib/supabase';

export default function BottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const navItems = getRoleNavigation(location.pathname);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const isActivePath = (path) => {
    if (path === '/landing') {
      return location.pathname === '/landing' || location.pathname === '/guest';
    }

    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/user';
    }

    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavItemClick = (item) => {
    if (!item.sectionId) {
      if (item.path === '/landing' && location.pathname === '/landing') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(item.path);
      }
      return;
    }

    navigate('/landing');
    setTimeout(() => {
      const section = document.getElementById(item.sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:px-4 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-4xl lg:max-w-5xl">
        <div className="flex items-center justify-start sm:justify-center gap-2 bg-[#63bce6] px-4 py-2 text-white shadow-lg sm:px-3 rounded-2xl overflow-x-auto scrollbar-hide scroll-smooth">
          {navItems.filter(item => (!item.requiresAuth || session) && (!item.requiresGuest || !session)).map((item) => (
            <button
              key={`${item.label}-${item.path}`}
              className={`shrink-0 min-w-[70px] flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${isActivePath(item.path) ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              onClick={() => handleNavItemClick(item)}
            >
              {item.icon ? item.icon : null}
              <span className="leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
