import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

console.log('LoginPage loading...');

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message || 'Login failed. Please try again.');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <MessageCircle size={40} />
          </div>
          <h1>Kutx Chat</h1>
          <p>Connect with friends and strangers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
          background: var(--bg-primary);
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-lg);
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
          border-radius: var(--radius-xl);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 1rem;
        }

        .auth-logo h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .auth-logo p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .input-with-icon .input {
          padding-left: 3rem;
          padding-right: 3rem;
        }

        .input-action {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.5rem;
        }

        .error-message {
          color: var(--error);
          font-size: 0.875rem;
          text-align: center;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .auth-footer a {
          color: var(--primary-color);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
