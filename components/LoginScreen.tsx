import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { ZenovaLogo } from './ZenovaLogo';
import { useTranslations } from '../hooks/useTranslations';
import { Locale } from '../translations/locales';

interface LoginScreenProps {
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { login, authError, isLoading } = useUser();
  const t = useTranslations();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isLoading) return;
    login(username, password);
  };

  const resolvedMessage = authError ? t[authError as keyof Locale] : null;
  const errorMessage = authError ? (typeof resolvedMessage === 'string' ? resolvedMessage : authError) : null;


  return (
    <div className="min-h-screen bg-gradient-to-br from-zen-50 to-zen-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <ZenovaLogo className="h-16 w-16 mx-auto text-zen-800" />
          <h1 className="mt-4 text-3xl font-bold text-zen-800 tracking-tight">
            {t.login_welcome}
          </h1>
          <p className="mt-1 text-md text-zen-600">
            {t.login_instruction}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/80">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-gray-700">{t.login_username}</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t.login_username_placeholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">{t.login_password}</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t.login_password_placeholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            
            <p className="text-xs text-center text-slate-500 pt-2">
              {t.forgotPasswordAdmin}
            </p>

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zen-800 hover:bg-zen-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500 disabled:opacity-50"
              disabled={!username || !password || isLoading}
            >
              {isLoading ? t.login_loading : t.login_button}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};