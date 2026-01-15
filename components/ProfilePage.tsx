
import React, { useState, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import type { Nurse, User } from '../types';

export const ProfilePage: React.FC<{ nurses: Nurse[] }> = ({ nurses }) => {
    const { user, changePassword } = useUser();
    const { language, setLanguage } = useLanguage();
    const t = useTranslations();

    // State for password change form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const associatedNurseName = useMemo(() => {
        if (user?.role === 'nurse' && (user as User).nurseId) {
            return nurses.find(n => n.id === (user as User).nurseId)?.name || t.unknown;
        }
        return null;
    }, [user, nurses, t]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos los campos son obligatorios.');
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
            await changePassword(currentPassword, newPassword);
            setSuccess(t.passwordChangeSuccess);
            // Clear fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as 'es' | 'en' | 'fr');
    };

    if (!user) return null;

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <header className="pb-3 border-b border-slate-200 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{t.profilePageTitle}</h2>
            </header>
            
            <div className="flex-grow overflow-auto pr-2 space-y-8">
                {/* User Information Section */}
                <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t.userInformation}</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">{t.fullName}:</span>
                            <span className="text-slate-800 font-semibold">{user.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">{t.username}:</span>
                            <span className="text-slate-800 font-semibold">{user.email}</span>
                        </div>
                        {associatedNurseName && (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">{t.associatedNurse}:</span>
                                <span className="text-slate-800 font-semibold">{associatedNurseName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Language Preferences Section */}
                <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t.languagePreferences}</h3>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-zen-500 focus:border-zen-500"
                    >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                </div>

                {/* Change Password Section */}
                <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t.changePasswordSectionTitle}</h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 text-sm">
                        <div>
                            <label className="block font-medium text-slate-600">{t.currentPassword}</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-600">{t.newPassword}</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block font-medium text-slate-600">{t.confirmNewPassword}</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 rounded-md" />
                        </div>
                        
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {success && <p className="text-sm text-green-600">{success}</p>}
                        
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-zen-800 text-white font-semibold rounded-md hover:bg-zen-700 disabled:opacity-50">
                                {isLoading ? 'Guardando...' : t.savePassword}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
