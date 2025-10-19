import React, { useState } from 'react';
import { X, Phone as PhoneIcon, User as UserIcon } from 'lucide-react';
import { signIn, signUp, setCurrentUser } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await signIn(phone);
      setCurrentUser(user);
      setIsLoading(false);
      onLogin(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!phone || !name) {
      setError('Please fill in all required fields');
      return;
    }

    if (phone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await signUp(phone, name);
      setCurrentUser(user);
      setIsLoading(false);
      onLogin(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
          </div>

          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setPhone('');
                setName('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {mode === 'login'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
