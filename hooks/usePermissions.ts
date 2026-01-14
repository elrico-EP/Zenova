
import { useUser } from '../contexts/UserContext';

export const usePermissions = () => {
    const { user: authUser, effectiveUser: viewContext } = useUser();

    // --- VIEW CONTEXT PERMISSIONS ---
    // These permissions are based ONLY on the user being impersonated or viewed.
    // They control what is VISIBLE in the UI.
    const isViewingAsAdmin = viewContext?.role === 'admin';
    const isViewingAsUser = viewContext?.role === 'nurse';

    // Admin-level visibility flags
    const canSeeAdminModules = isViewingAsAdmin;
    const canManageTeam = isViewingAsAdmin;
    const canManageJornadas = isViewingAsAdmin;
    const canManageStrasbourg = isViewingAsAdmin;
    const canManageVaccination = isViewingAsAdmin;
    const canDoMassAbsence = isViewingAsAdmin;
    const canLockMonth = isViewingAsAdmin;
    const canDoManualChanges = isViewingAsAdmin;
    const canExport = isViewingAsAdmin;
    const canValidateWishes = isViewingAsAdmin;

    // Permissions available to both view contexts
    const canManageSwaps = true; // Create/undo visual swaps is visible for both
    const canViewHistory = true;
    const canEditGeneralNotes = true;

    // Granular/context-dependent visibility
    const canEditOwnWishes = true; // A user can always see their own wishes column as editable
    
    /**
     * Determines if the UI for editing a personal agenda should be visible.
     * Rule: The UI appears editable if the current view context is a nurse viewing their own agenda.
     */
    const canSeePersonalAgendaAsEditable = (agendaOwnerId: string): boolean => {
        return isViewingAsUser && viewContext.id === agendaOwnerId;
    };

    /**
     * Determines if the button/link to open a personal agenda should be visible.
     * Rule: Admins can see all, users can only see their own.
     */
    const canOpenPersonalAgenda = (agendaOwnerId: string): boolean => {
        return isViewingAsAdmin || (isViewingAsUser && viewContext.id === agendaOwnerId);
    };

    // --- REAL AUTH PERMISSIONS ---
    // These permissions are based ONLY on the authenticated user (`authUser`).
    // They should be used to authorize actual actions (e.g., database writes).
    const isRealAdmin = authUser?.role === 'admin';
    const isRealUser = authUser?.role === 'nurse';

    /**
     * Determines if the current authenticated user has the real permission to edit a personal agenda.
     * Rule: Only a real nurse user can edit their own agenda. Admins CANNOT.
     */
    const canActuallyEditPersonalAgenda = (agendaOwnerId: string): boolean => {
        return isRealUser && authUser.id === agendaOwnerId;
    };
    
    return {
        // View Context Flags
        isViewingAsAdmin,
        isViewingAsUser,
        
        // Admin-only UI capabilities
        canSeeAdminModules,
        canManageTeam,
        canManageJornadas,
        canManageStrasbourg,
        canManageVaccination,
        canDoMassAbsence,
        canLockMonth,
        canDoManualChanges,
        canExport,
        canValidateWishes,

        // Shared UI capabilities
        canManageSwaps,
        canViewHistory,
        canEditGeneralNotes,
        
        // Granular/context-dependent UI capabilities
        canEditOwnWishes,
        canSeePersonalAgendaAsEditable,
        canOpenPersonalAgenda,
        
        // Real Authorization Flags (for guarding actions)
        isRealAdmin,
        isRealUser,
        canActuallyEditPersonalAgenda
    };
};
