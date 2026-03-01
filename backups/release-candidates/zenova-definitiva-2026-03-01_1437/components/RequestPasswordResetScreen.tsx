import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { ZenovaLogo } from './ZenovaLogo';
import { useTranslations } from '../hooks/useTranslations';

export const RequestPasswordResetScreen: React.FC<{
  onSuccess: (username: string) => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const { requestPasswordReset } = useUser();
  const t = useTranslations();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    
    try {
      const userExists = await requestPasswordReset(username);
      if (userExists) {
        onSuccess(username);
      } else {
        setError(t.userNotFound);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zen-50 to-zen-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <ZenovaLogo className="h-16 w-16 mx-auto text-zen-800" />
          <h1 className="mt-4 text-3xl font-bold text-zen-800 tracking-tight">
            {t.passwordResetTitle}
          </h1>
          <p className="mt-1 text-md text-zen-600">
            {t.passwordResetInstruction}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="reset-username" className="block text-sm font-medium text-gray-700">{t.login_username}</label>
              <input
                id="reset-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t.login_username_placeholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zen-800 hover:bg-zen-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? t.passwordReset_verifying : t.passwordReset_button}
            </button>
             <button
              type="button"
              onClick={onCancel}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500"
            >
              {t.back} {t.backToLogin}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};