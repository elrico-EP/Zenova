
import React from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = React.useState('');

  const handleSaveClick = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-lg w-full transform transition-all text-center">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-zen-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zen-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7z" />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-zen-800 mt-6" id="modal-title">
          Configurar Clave de API
        </h3>
        <div className="mt-4">
          <p className="text-sm text-zen-500">
            Para utilizar la aplicación fuera de AI Studio, por favor introduce tu clave de API de Google. Tu clave se guarda de forma segura en tu navegador.
          </p>
        </div>
        <div className="mt-6">
           <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Pega tu clave de API aquí"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-zen-500 focus:border-zen-500 sm:text-sm text-center"
          />
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-zen-600 hover:underline mt-2 inline-block">
            ¿No tienes una clave? Consíguela aquí
          </a>
        </div>
        <div className="mt-8">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 bg-zen-800 text-base font-medium text-white hover:bg-zen-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zen-500 sm:text-sm disabled:opacity-50"
            onClick={handleSaveClick}
            disabled={!apiKey.trim()}
          >
            Guardar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};