import { useState, useEffect } from 'react';
import { Podcast, Lock, Eye, EyeOff } from 'lucide-react';

const WRONG_PASSWORD_MESSAGES = [
  "Nope! That's not it.",
  "Nice try, but no cigar.",
  "The password remains elusive...",
  "Swing and a miss!",
  "That password is in another castle.",
  "Close! Just kidding, not close at all.",
  "The password gods frown upon this attempt.",
  "Incorrect. Have you tried 'password123'? (Don't, that's not it either.)",
  "Bzzt! Wrong answer.",
  "That's a negative, Ghost Rider.",
  "The password you entered has been found wanting.",
  "Error 401: Unauthorized and slightly embarrassed.",
  "Plot twist: that's not the password.",
  "Your password-fu is weak.",
  "The secret word is not that word.",
  "Hmm, that doesn't ring a bell.",
  "Access denied. The computer says no.",
  "That password has left the building.",
  "Incorrect password detected. Deploying mild disappointment.",
  "Not quite! But points for trying.",
];

interface PasswordGateProps {
  children: React.ReactNode;
}

const PASSWORD = 'friendofben';
const AUTH_KEY = 'speech2pod_auth';

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      const randomMessage = WRONG_PASSWORD_MESSAGES[Math.floor(Math.random() * WRONG_PASSWORD_MESSAGES.length)];
      setError(randomMessage);
      setPassword('');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Podcast className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Speech2Pod</h1>
          <p className="text-gray-500 mt-1">Convert speeches to podcasts</p>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-6 justify-center">
          <Lock className="w-4 h-4" />
          <span className="text-sm">This app is in private beta</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Enter password to continue
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
          >
            Enter
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Don't have the password? Ask Ben!
        </p>
      </div>
    </div>
  );
}
