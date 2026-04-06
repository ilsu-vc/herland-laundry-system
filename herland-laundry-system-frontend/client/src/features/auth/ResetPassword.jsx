import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase automatically establishes a session when the user clicks the
    // password-recovery email link (PASSWORD_RECOVERY event in main.jsx).
    // We just need to confirm that a valid session exists before allowing reset.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      } else {
        // Also try parsing access_token from URL hash (fallback for older Supabase flows)
        const hash = location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            setHasSession(true);
            return;
          }
        }
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('access_token')) {
          setHasSession(true);
          return;
        }
        setError('No active reset session found. Please request a new reset link.');
      }
    };
    checkSession();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // We can call Supabase directly here since we have the token
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Password updated successfully! You can now login with your new password.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center bg-white px-4 md:px-6">
      <div className="w-full max-w-md md:max-w-lg">
        <div className="md:rounded-2xl md:border md:border-[#e6eef8] md:bg-white md:px-10 md:py-10 md:shadow-sm">
          
          <h1 className="text-xl font-semibold text-[#3878c2] mb-6 text-center">Reset Your Password</h1>

          <p className="text-sm text-gray-600 mb-6 text-center">
            Please enter your new password below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 mb-6">
              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full border border-[#3878c2] rounded px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none placeholder-[#b4b4b4] bg-[#ffffff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#3878c2]"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password Input */}
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full border border-[#3878c2] rounded px-3 py-3 text-sm font-semibold text-[#3878c2] outline-none placeholder-[#b4b4b4] bg-[#ffffff]"
              />
            </div>

            {error && <p className="text-xs text-[#ff0000] mb-3 text-center">{error}</p>}
            {message && <p className="text-xs text-green-600 mb-3 text-center font-medium">{message}</p>}

            <button
              type="submit"
              disabled={loading || !!message}
              className={`w-full py-3 rounded text-sm font-semibold transition-colors ${
                !loading && !message ? 'bg-[#4bad40] text-white hover:bg-[#45a338]' : 'bg-[#b4b4b4] text-white cursor-not-allowed'
              }`}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
