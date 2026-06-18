import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { session, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#3878c2] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#3878c2] font-semibold text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's no session at all, kick them out to login.
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If a specific set of roles is required and the current user isn't in it, kick them to their appropriate dashboard.
  if (allowedRoles.length > 0) {
    const roleMatch = allowedRoles.some(r => r.toLowerCase() === (activeRole || '').toLowerCase());
    
    if (!roleMatch) {
      const activeLower = (activeRole || '').toLowerCase();
      if (activeLower === 'admin') return <Navigate to="/admin" replace />;
      if (activeLower === 'staff' || activeLower === 'employee') return <Navigate to="/staff" replace />;
      if (activeLower === 'rider') return <Navigate to="/rider" replace />;
      return <Navigate to="/dashboard" replace />; // fallback to customer dashboard
    }
  }

  // Otherwise, render the child routes!
  return <Outlet />;
}
