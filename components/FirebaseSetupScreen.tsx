import React, { useState } from 'react';
import { saveConfigAndReload } from '../firebase/config';
import { ZenovaLogo } from './ZenovaLogo';

export const FirebaseSetupScreen: React.FC = () => {
    const [configText, setConfigText] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        setError('');
        let configString = configText.trim();
        
        // Extrae el objeto de configuración si el usuario pega todo el script
        const match = configString.match(/firebaseConfig\s*=\s*({[\s\S]*?});/);
        if (match && match[1]) {
            configString = match[1];
        }

        try {
            const config = JSON.parse(configString);
            if (!config.apiKey || !config.projectId || !config.authDomain) {
                throw new Error("El objeto de configuración no contiene las claves necesarias como 'apiKey', 'projectId' o 'authDomain'.");
            }
            saveConfigAndReload(config);
        } catch (e) {
            setError(`Formato de configuración inválido. Por favor, pega el objeto JavaScript de tu configuración de Firebase. Error: ${(e as Error).message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-soft-100 to-amber-soft-200 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-6">
                    <ZenovaLogo className="h-16 w-16 mx-auto" />
                    <h1 className="mt-4 text-3xl font-bold text-amber-soft-900 tracking-tight">
                        Configuración de Firebase Requerida
                    </h1>
                    <p className="mt-2 text-md text-amber-soft-800/80">
                        Esta aplicación necesita conectarse a tu proyecto de Firebase para funcionar.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-200/80">
                    <div className="space-y-4 text-sm text-slate-700">
                        <p><strong>Paso 1:</strong> Ve a tu <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">Consola de Firebase</a>.</p>
                        <p><strong>Paso 2:</strong> Selecciona tu proyecto, luego ve a <code className="bg-slate-200 p-1 rounded text-xs">Configuración del proyecto</code> (icono ⚙️).</p>
                        <p><strong>Paso 3:</strong> En la sección "Tus apps", busca tu aplicación web y haz clic en el botón de opción <code className="bg-slate-200 p-1 rounded text-xs">Configuración</code>.</p>
                        <p><strong>Paso 4:</strong> Copia el objeto completo <code className="bg-slate-200 p-1 rounded text-xs">firebaseConfig</code> y pégalo abajo.</p>
                    </div>

                    <div className="mt-6">
                        <textarea
                            value={configText}
                            onChange={(e) => setConfigText(e.target.value)}
                            rows={10}
                            placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  ...\n};`}
                            className="w-full p-3 font-mono text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zen-500 focus:border-zen-500"
                        />
                    </div>

                    {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

                    <div className="mt-6">
                        <button
                            onClick={handleSave}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-admin-red-500 hover:bg-admin-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-red-500 disabled:opacity-50"
                            disabled={!configText.trim()}
                        >
                            Guardar Configuración e Iniciar App
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
