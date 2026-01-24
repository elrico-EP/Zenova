import React, { useState } from 'react';
import { saveConfigAndReload } from '../firebase/config';
import { ZenovaLogo } from './ZenovaLogo';

export const FirebaseSetupScreen: React.FC = () => {
    const [configText, setConfigText] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const handleSave = () => {
        setStatus('processing');
        setError('');

        // Usar un timeout para asegurar que el estado "processing" se renderice antes de cualquier bloqueo
        setTimeout(() => {
            const pastedText = configText;

            const getValue = (key: string): string | null => {
                const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`);
                const match = pastedText.match(regex);
                return match ? match[1] : null;
            };

            const config = {
                apiKey: getValue('apiKey'),
                authDomain: getValue('authDomain'),
                projectId: getValue('projectId'),
                storageBucket: getValue('storageBucket'),
                messagingSenderId: getValue('messagingSenderId'),
                appId: getValue('appId'),
                measurementId: getValue('measurementId')
            };
            
            const validation = {
                apiKey: !!config.apiKey,
                authDomain: !!config.authDomain,
                projectId: !!config.projectId,
            };

            if (!validation.apiKey || !validation.authDomain || !validation.projectId) {
                setError(`Validación fallida. No se pudieron encontrar todas las claves necesarias.\n\nValores encontrados:\n- apiKey: ${validation.apiKey ? '✅' : '❌'}\n- authDomain: ${validation.authDomain ? '✅' : '❌'}\n- projectId: ${validation.projectId ? '✅' : '❌'}\n\nPor favor, asegúrate de pegar el objeto \`firebaseConfig\` completo y sin modificar.`);
                setStatus('error');
                return;
            }

            try {
                saveConfigAndReload(config);
                setStatus('success');
            } catch (e) {
                setError(`Ocurrió un error al intentar guardar la configuración. Error: ${(e as Error).message}`);
                setStatus('error');
            }
        }, 100);
    };
    
    const getButtonContent = () => {
        switch (status) {
            case 'processing':
                return 'Verificando...';
            case 'success':
                return '¡Éxito!';
            case 'error':
                return 'Intentar de Nuevo';
            case 'idle':
            default:
                return 'Guardar Configuración e Iniciar App';
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
                    {status !== 'success' ? (
                        <>
                            <div className="space-y-4 text-sm text-slate-700">
                                <p><strong>Paso 1:</strong> Ve a tu <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">Consola de Firebase</a>.</p>
                                <p><strong>Paso 2:</strong> Selecciona tu proyecto, luego ve a <code className="bg-slate-200 p-1 rounded text-xs">Configuración del proyecto</code> (icono ⚙️).</p>
                                <p><strong>Paso 3:</strong> En la sección "Tus apps", busca tu aplicación web y haz clic en el botón de opción <code className="bg-slate-200 p-1 rounded text-xs">Configuración</code>.</p>
                                <p><strong>Paso 4:</strong> Copia el bloque de código que contiene <code className="bg-slate-200 p-1 rounded text-xs">firebaseConfig</code> y pégalo abajo.</p>
                            </div>

                            <div className="mt-6">
                                <textarea
                                    value={configText}
                                    onChange={(e) => { setConfigText(e.target.value); setStatus('idle'); setError(''); }}
                                    rows={10}
                                    placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  ...\n};`}
                                    className="w-full p-3 font-mono text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zen-500 focus:border-zen-500"
                                />
                            </div>
                            
                            {error && <pre className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-wrap font-sans">{error}</pre>}

                            <div className="mt-6">
                                <button
                                    onClick={handleSave}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-admin-red-500 hover:bg-admin-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin-red-500 disabled:opacity-50"
                                    disabled={!configText.trim() || status === 'processing'}
                                >
                                    {getButtonContent()}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-lg leading-6 font-medium text-gray-900">¡Configuración Guardada!</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    La aplicación intentará recargarse. Si no lo hace en unos segundos, haz clic en el botón de abajo.
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Recargar Página Ahora
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
