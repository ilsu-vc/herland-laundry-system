import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // email | mobile
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');

  // Validation
  useEffect(() => {
    if (!value) {
      setWarning('');
      return;
    }

    if (mode === 'mobile') {
      const phMobileRegex = /^9\d{9}$/;
      setWarning(
        phMobileRegex.test(value)
          ? ''
          : 'Please enter a valid Philippine mobile number'
      );
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setWarning(
        emailRegex.test(value) ? '' : 'Please enter a valid email address'
      );
    }
  }, [value, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (warning || !value) return;

    setLoading(true);
    setError('');
    setMessage('');

    const identifier = mode === 'mobile' ? `+63${value}` : value;

    try {
      const { error: resetError } = mode === 'email' 
        ? await supabase.auth.resetPasswordForEmail(identifier, {
            redirectTo: `${window.location.origin}/reset-password`,
          })
        : await supabase.auth.signInWithOtp({
            phone: identifier,
          });

      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(
          mode === 'email'
            ? 'Password reset link sent! Please check your email.'
            : 'OTP sent! Please check your messages.'
        );
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
          
          <div className="flex items-center gap-2 text-[#3878c2] mb-6">
            <button onClick={() => navigate('/login')} className="p-1 hover:bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Forgot Password</h1>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Enter your {mode === 'email' ? 'email' : 'mobile number'} below and we'll send you a link to reset your password.
          </p>

          <div className="flex mb-4 overflow-hidden rounded">
            <button
              type="button"
              onClick={() => { setMode('mobile'); setValue(''); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'mobile' ? 'bg-[#4bad40] text-white' : 'bg-[#b4b4b4] text-white'
              }`}
            >
              Mobile Number
            </button>
            <button
              type="button"
              onClick={() => { setMode('email'); setValue(''); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                mode === 'email' ? 'bg-[#4bad40] text-white' : 'bg-[#b4b4b4] text-white'
              }`}
            >
              Email Address
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex items-center border border-[#3878c2] rounded px-3 py-2 mb-3">
              {mode === 'mobile' && (
                <div className="flex items-center mr-3">
                  <span className="text-[#3878c2] text-sm font-semibold select-none">+63</span>
                  <span className="mx-2 h-5 w-px bg-[#3878c2]" />
                </div>
              )}
              <input
                type={mode === 'mobile' ? 'tel' : 'email'}
                value={value}
                onChange={(e) => {
                  let val = e.target.value;
                  if (mode === 'mobile') {
                    val = val.replace(/\D/g, '');
                    if (val.length > 10) val = val.slice(0, 10);
                  }
                  setValue(val);
                }}
                placeholder={mode === 'mobile' ? 'Enter mobile number' : 'Enter email address'}
                className="w-full outline-none bg-white text-sm font-semibold text-[#3878c2] placeholder-[#b4b4b4]"
              />
            </div>

            {warning && <p className="text-xs text-[#ff0000] mb-2">{warning}</p>}
            {error && <p className="text-xs text-[#ff0000] mb-3 text-center">{error}</p>}
            {message && <p className="text-xs text-green-600 mb-3 text-center font-medium">{message}</p>}

            <button
              type="submit"
              disabled={!!warning || !value || loading}
              className={`w-full py-2 rounded text-sm font-semibold transition-colors mb-4 ${
                !warning && value && !loading ? 'bg-[#4bad40] text-white hover:bg-[#45a338]' : 'bg-[#b4b4b4] text-white cursor-not-allowed'
              }`}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2 text-sm font-semibold text-[#3878c2] hover:underline"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
