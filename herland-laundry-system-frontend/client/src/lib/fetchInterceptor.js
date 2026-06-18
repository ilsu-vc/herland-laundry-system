import { supabase } from './supabase';

let isInterceptorAttached = false;

export function attachFetchInterceptor(onUnauthorized) {
  if (isInterceptorAttached) return;
  isInterceptorAttached = true;

  const originalFetch = window.fetch;
  let isLoggingOut = false;

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    if (response.status === 401 && !isLoggingOut) {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      
      // Only intercept our own API calls
      if (url.includes('/api/v1/')) {
        isLoggingOut = true;
        console.warn('[Session] Token expired or invalid. Signing out automatically.');
        
        window.sessionStorage.removeItem('activeRole');
        await supabase.auth.signOut().catch(() => {});
        
        if (onUnauthorized) {
          onUnauthorized();
        }
        
        setTimeout(() => { isLoggingOut = false; }, 3000);
      }
    }

    return response;
  };
}
