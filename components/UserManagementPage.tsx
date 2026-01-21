import React, { useState, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import type { User, Nurse, UserRole } from '../types';
import { useTranslations } from '../hooks/useTranslations';

const UserForm: React.FC<{
    userToEdit?: User | Nurse;
    onSave: (userData: any) => Promise<void>;
    onCancel: () => void;
    nurses: Nurse[];
    users: (User | Nurse)[];
}> = ({ userToEdit, onSave, onCancel, nurses, users }) => {
    const { user: currentUser } = useUser();
    const t = useTranslations();
    const [name, setName] = useState(userToEdit?.name || '');
    const [username, setUsername] = useState(userToEdit?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(userToEdit?.role || 'nurse');
    const [nurseId, setNurseId] = useState((userToEdit as User)?.nurseId || '');
    const [error, setError] = useState('');
    
    const isEditingSelf = currentUser?.id === userToEdit?.id;
    const canEditPassword = !userToEdit || isEditingSelf || (currentUser?.role === 'admin' && userToEdit?.role !== 'admin');

    const associatedNurseIds = useMemo(() =>
        users.map(u => (u as User).nurseId).filter(Boolean),
    [users]);

    const availableNurses = useMemo(() =>
        nurses.filter(n => !associatedNurseIds.includes(n.id) || (userToEdit && (userToEdit as User).nurseId === n.id)),
    [nurses, associatedNurseIds, userToEdit]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !username || (!userToEdit && !password)) {
            setError(t.allFieldsRequired);
            return;
        }
        if (role === 'nurse' && !nurseId) {
            setError(t.associateNurseError);
            return;
        }

        try {
            const userData: any = { id: userToEdit?.id, name, email: username, role };
            if (role === 'nurse') {
                userData.nurseId = nurseId;
            } else {
                userData.nurseId = null; // Ensure non-nurses are not associated
            }
            if (password) {
                userData.password = password;
                // If an admin is editing another user and setting a new password, force change on next login
                if (currentUser?.role === 'admin' && userToEdit && currentUser.id !== userToEdit.id) {
                    userData.mustChangePassword = true;
                    userData.passwordResetRequired = false; // Ensure old flag is cleared
                }
            }
            await onSave(userData);
        } catch(e) {
            setError((e as Error).message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">{userToEdit ? t.editUser : t.newUser}</h3>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    <div><label className="block font-medium">{t.fullName}</label><input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full p-2 border rounded"/></div>
                    <div><label className="block font-medium">{t.username}</label><input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full p-2 border rounded"/></div>
                    {canEditPassword && <div><label className="block font-medium">{t.password} {userToEdit ? `(${t.passwordInfo})` : ''}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required={!userToEdit} className="w-full p-2 border rounded"/></div>}
                    <div>
                        <label className="block font-medium">{t.role}</label>
                        <select value={role} onChange={e=>setRole(e.target.value as UserRole)} className="w-full p-2 border rounded bg-white disabled:bg-slate-100" disabled={!!userToEdit && userToEdit.role === 'admin' && !isEditingSelf}>
                            <option value="nurse">{t.role_nurse}</option>
                            <option value="viewer">{t.role_viewer}</option>
                            <option value="admin">{t.role_admin}</option>
                        </select>
                    </div>
                    {role === 'nurse' && (
                         <div>
                            <label className="block font-medium">{t.associatedNurse}</label>
                            <select value={nurseId} onChange={e => setNurseId(e.target.value)} required className="w-full p-2 border rounded bg-white">
                                <option value="">{t.selectNursePrompt}</option>
                                {availableNurses.map(n => (
                                    <option key={n.id} value={n.id}>{n.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 rounded-md">{t.cancel}</button><button type="submit" className="px-4 py-2 bg-zen-800 text-white rounded-md">{t.save}</button></div>
                </form>
            </div>
        </div>
    );
};

export const UserManagementPage: React.FC<{ nurses: Nurse[] }> = ({ nurses }) => {
    const { users, register, updateUser, deleteUser, user: currentUser } = useUser();
    const t = useTranslations();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | Nurse | undefined>(undefined);

    const handleOpenForm = (user?: User | Nurse) => {
        setUserToEdit(user);
        setIsFormOpen(true);
    };

    const handleSave = async (userData: any) => {
        if (userData.id) {
            await updateUser(userData);
        } else {
            await register(userData);
        }
        setIsFormOpen(false);
        setUserToEdit(undefined);
    };
    
    const handleDelete = async (userId: string) => {
        if(window.confirm(t.deleteUserConfirm)) {
            await deleteUser(userId);
        }
    }
    
    // Add a mapping for roles to translation keys
    const roleTranslation: Record<UserRole, string> = {
        admin: t.role_admin,
        nurse: t.role_nurse,
        viewer: t.role_viewer
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 p-4 h-full flex flex-col">
            <header className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-800">{t.userManagementTitle}</h2>
                <button onClick={() => handleOpenForm()} className="px-4 py-2 bg-zen-700 text-white font-semibold rounded-md hover:bg-zen-600">+ {t.newUser}</button>
            </header>

            <div className="flex-grow overflow-auto">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                        <tr>
                            <th className="p-2 border-b-2 font-semibold text-slate-600 text-left">{t.fullName}</th>
                            <th className="p-2 border-b-2 font-semibold text-slate-600 text-left">{t.username}</th>
                            <th className="p-2 border-b-2 font-semibold text-slate-600 text-left">{t.role}</th>
                            <th className="p-2 border-b-2 font-semibold text-slate-600 text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="p-2 border-b">{u.name}</td>
                                <td className="p-2 border-b">{u.email}</td>
                                <td className="p-2 border-b capitalize">{roleTranslation[u.role] || u.role}</td>
                                <td className="p-2 border-b text-right">
                                    <button onClick={() => handleOpenForm(u)} className="p-1 text-blue-600 hover:underline">{t.edit}</button>
                                    {currentUser?.id !== u.id && u.role !== 'admin' && 
                                        <>
                                            <button onClick={() => handleDelete(u.id)} className="p-1 text-red-600 hover:underline ml-2">{t.delete}</button>
                                        </>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <UserForm userToEdit={userToEdit} onSave={handleSave} onCancel={() => setIsFormOpen(false)} nurses={nurses} users={users} />}
        </div>
    );
};