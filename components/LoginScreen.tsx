import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { ZenovaLogo } from './ZenovaLogo';

export const LoginScreen: React.FC = () => {
  const { login, authError, isLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zen-50 to-zen-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <ZenovaLogo className="h-16 w-16 mx-auto text-zen-800" />
          <h1 className="mt-4 text-3xl font-bold text-zen-800 tracking-tight">
            Bienvenido/a a Zenova
          </h1>
          <p className="mt-1 text-md text-zen-600">
            Inicia sesión para acceder al planificador.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/80">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com o elvio@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-zen-500 focus:border-zen-500 sm:text-sm"
              />
               <p className="text-xs text-slate-400 mt-1">Nota: Para la demo, usa cualquier contraseña. Las cuentas de enfermeros se basan en `INITIAL_NURSES`.</p>
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zen-800 hover:bg-zen-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500 disabled:opacity-50"
              disabled={!email || !password || isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
