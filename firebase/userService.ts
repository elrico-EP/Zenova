// Servicio de usuarios temporal (sin Firebase)
export const getCurrentUser = async () => {
    // No devolver usuario automáticamente
    return null;
};

export const loginUser = async (username: string, password: string) => {
    // Usuario de prueba
    if (username === 'admin' && password === 'admin') {
        return {
            id: 'user-1',
            name: 'Admin',
            role: 'admin',
            email: 'admin@example.com'
        };
    }
    throw new Error('Usuario o contraseña incorrectos');
};

export const logoutUser = async () => {
    return;
};

export const getAllUsers = async () => {
    return [];
};
