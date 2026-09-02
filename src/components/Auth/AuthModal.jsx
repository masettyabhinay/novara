import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { triggerGoogleSignIn } from '../../services/googleAuth';
import { 
  Compass, 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    currentUser, 
    handleLogin, 
    handleSignup, 
    handleGoogleLogin,
    showToast 
  } = useApp();

  const [authView, setAuthView] = useState('welcome'); // 'welcome' | 'login' | 'signup' | 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await handleLogin(formData.email, formData.password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignup = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await handleSignup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (loading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      // 1. Open Google OAuth2 picker & obtain real Google verified token
      const googleTokens = await triggerGoogleSignIn();

      // 2. Server-side verification & session creation
      const res = await handleGoogleLogin(googleTokens);
      if (!res.success) {
        setErrorMsg(res.error || 'Google sign-in failed.');
      }
    } catch (err) {
      console.warn('[Google Sign-In Error]', err);
      setErrorMsg(err.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isAnyLoading = loading || isGoogleLoading;

  const renderGoogleButton = (marginBottom = '16px') => (
    <button
      type="button"
      onClick={onGoogleSignIn}
      disabled={isAnyLoading}
      className="btn-secondary"
      style={{ 
        width: '100%', 
        padding: '11px', 
        fontSize: '13px', 
        marginBottom: marginBottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: isAnyLoading ? 0.75 : 1,
        cursor: isAnyLoading ? 'not-allowed' : 'pointer'
      }}
    >
      {isGoogleLoading ? (
        <>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Signing in with Google...</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={() => currentUser && setIsAuthModalOpen(false)}>
      <div 
        className="modal-content-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '32px 28px', maxWidth: '460px' }}
      >
        {/* Header Close button (only visible if user already logged in) */}
        {currentUser && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-beige)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: 'var(--accent-terracotta)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            margin: '0 auto 12px auto',
            boxShadow: '0 6px 18px var(--accent-terracotta-glow)'
          }}>
            <Compass size={26} strokeWidth={2.2} />
          </div>

          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--text-charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: '4px'
          }}>
            NOVARA
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Your new career begins here.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'var(--accent-terracotta-light)',
            border: '1px solid rgba(200, 90, 50, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--accent-terracotta)',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={15} flexShrink={0} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. WELCOME SCREEN */}
        {authView === 'welcome' && (
          <div style={{ animation: 'fadeIn 200ms ease' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-xl)',
              padding: '18px 20px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Transform your raw placement roadmap into an intelligent, adaptive daily study journey.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                disabled={isAnyLoading}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setAuthView('login')}
                disabled={isAnyLoading}
                className="btn-secondary"
                style={{ width: '100%', padding: '13px', fontSize: '14px' }}
              >
                <span>Log In</span>
              </button>
            </div>

            {/* Google SSO */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-beige-light)', textAlign: 'center' }}>
              {renderGoogleButton('0px')}
            </div>
          </div>
        )}

        {/* 2. LOGIN SCREEN */}
        {authView === 'login' && (
          <form onSubmit={onSubmitLogin} style={{ animation: 'fadeIn 200ms ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot')}
                    style={{ fontSize: '11px', color: 'var(--accent-terracotta)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px'
                }}>
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '14px', marginBottom: '14px' }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              <span>{loading ? 'Logging in...' : 'Log In'}</span>
            </button>

            {/* Google Login */}
            {renderGoogleButton('16px')}

            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('signup')}
                style={{ color: 'var(--accent-terracotta)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* 3. SIGNUP SCREEN */}
        {authView === 'signup' && (
          <form onSubmit={onSubmitSignup} style={{ animation: 'fadeIn 200ms ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '5px' }}>
                  Full Name
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <User size={15} color="var(--text-muted)" />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Maya Chen"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '5px' }}>
                  Password
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <Lock size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-charcoal)', display: 'block', marginBottom: '5px' }}>
                  Confirm Password
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-beige)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px'
                }}>
                  <ShieldCheck size={15} color="var(--text-muted)" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAnyLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '14px', marginBottom: '14px' }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            </button>

            {/* Google Signup */}
            {renderGoogleButton('16px')}

            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('login')}
                style={{ color: 'var(--accent-terracotta)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD */}
        {authView === 'forgot' && (
          <div style={{ animation: 'fadeIn 200ms ease', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter your email and we'll send a password recovery reset link.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-beige)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px'
            }}>
              <Mail size={16} color="var(--text-muted)" />
              <input
                type="email"
                placeholder="name@university.edu"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                showToast('Reset Link Dispatched 📩', 'Check your inbox for instructions.');
                setAuthView('login');
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', marginBottom: '12px' }}
            >
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setAuthView('login')}
              style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
