import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { ZenovaLogo } from './ZenovaLogo';
import { useTranslations } from '../hooks/useTranslations';

export const ForceChangePasswordScreen: React.FC = () => {
  const { forceSetPassword } = useUser();
  const t = useTranslations();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!newPassword || !confirmPassword) {
      setError(t.allFieldsRequired);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatchError);
      return;
    }
    if (newPassword.length < 6) {
      setError(t.passwordLengthError);
      return;
    }

    setIsLoading(true);
    try {
      await forceSetPassword(newPassword);
      // La actualización del contexto en App.tsx se encargará de renderizar la app principal.
    } catch (e) {
      setError((e as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zen-50 to-zen-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <ZenovaLogo className="h-16 w-16 mx-auto text-zen-800" />
          <h1 className="mt-4 text-3xl font-bold text-zen-800 tracking-tight">
            {t.forceChangePasswordTitle}
          </h1>
          <p className="mt-1 text-md text-zen-600">
            {t.forceChangePasswordInstruction}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">{t.newPassword}</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">{t.confirmNewPassword}</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zen-800 hover:bg-zen-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? t.saving : t.savePassword}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};