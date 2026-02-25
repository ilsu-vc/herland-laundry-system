import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { useLocation } from 'react-router-dom'
import BottomNavbar from './shared/navigation/BottomNavbar'
import TopNavbar from './shared/navigation/TopNavbar'
import { useLayout } from './app/LayoutContext'
import AppRoutes from './app/Routes'
import Providers from './app/Providers'
import './index.css'
import 'flowbite'

function AppShell() {
  const location = useLocation()
  const isLoginRoute = location.pathname === '/login'
  const isSignupRoute = location.pathname === '/signup'
  const isLandingRoute = location.pathname === '/landing' || location.pathname === '/guest'
  const isRoleSwitcherRoute = location.pathname === '/role-switcher'
  const isPublicRoute = isLandingRoute || isLoginRoute || isSignupRoute || isRoleSwitcherRoute
  const { hideBottomNav } = useLayout()

  useEffect(() => {
    // Only update activeRole if we are specifically on a root dashboard path
    // and don't already have a valid role session, or to sync with the current section.
    if (location.pathname.startsWith('/staff')) {
      window.sessionStorage.setItem('activeRole', 'Staff')
      return
    }

    if (location.pathname.startsWith('/rider')) {
      window.sessionStorage.setItem('activeRole', 'Rider')
      return
    }

    if (location.pathname.startsWith('/admin')) {
      window.sessionStorage.setItem('activeRole', 'Admin')
      return
    }

    // If on a user/auth path and no role is set, default to user
    const isUserPath = location.pathname.startsWith('/user') || 
                      location.pathname.startsWith('/dashboard') || 
                      location.pathname.startsWith('/book') || 
                      location.pathname.startsWith('/profile');
                      
    if (isUserPath && !window.sessionStorage.getItem('activeRole')) {
      window.sessionStorage.setItem('activeRole', 'Customer')
    }
  }, [location.pathname])

  return (
    <div className={`min-h-screen bg-white ${isLoginRoute ? 'h-screen overflow-hidden' : ''}`}>
      <TopNavbar />
      <div
        className={`mx-auto w-full ${
          isLandingRoute ? 'max-w-none px-0' : 'max-w-none px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8'
        } ${isLoginRoute ? '' : 'pb-24 lg:pb-10'}`}
      >
        <div className="min-w-0">
          <AppRoutes />
        </div>
      </div>
      {!hideBottomNav && (
        <div className="lg:hidden">
          <BottomNavbar />
        </div>
      )}
    </div>
  )
}

function AppRoot() {
  return (
    <React.StrictMode>
      <Providers>
        <AppShell />
      </Providers>
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(<AppRoot />)
