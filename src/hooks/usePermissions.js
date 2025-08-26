import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user, isAdmin } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;

    switch (permission) {
      case 'admin':
        return isAdmin();
      case 'student':
        return user.role === 'student' || isAdmin();
      case 'authenticated':
        return !!user;
      default:
        return false;
    }
  };

  const canAccess = (resource) => {
    if (!user) return false;

    const permissions = {
      'admin-dashboard': isAdmin(),
      'groups': !!user,
      'weekly-visits': !!user,
      'career-guidance': !!user,
      'chatbot': !!user,
      'create-group': isAdmin(),
      'manage-users': isAdmin(),
      'upload-content': isAdmin(),
    };

    return permissions[resource] || false;
  };

  return {
    user,
    hasPermission,
    canAccess,
    isAdmin: isAdmin(),
    isAuthenticated: !!user,
  };
};

export default usePermissions;