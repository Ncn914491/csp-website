import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const RoleGuard = ({ 
  children, 
  role = null, 
  permission = null, 
  resource = null, 
  fallback = null,
  requireAll = false 
}) => {
  const { hasPermission, canAccess, user } = usePermissions();

  // Check if user meets the requirements
  const hasAccess = () => {
    if (!user) return false;

    const checks = [];

    // Check role-based access
    if (role) {
      if (Array.isArray(role)) {
        checks.push(role.some(r => hasPermission(r)));
      } else {
        checks.push(hasPermission(role));
      }
    }

    // Check permission-based access
    if (permission) {
      if (Array.isArray(permission)) {
        checks.push(permission.some(p => hasPermission(p)));
      } else {
        checks.push(hasPermission(permission));
      }
    }

    // Check resource-based access
    if (resource) {
      if (Array.isArray(resource)) {
        checks.push(resource.some(r => canAccess(r)));
      } else {
        checks.push(canAccess(resource));
      }
    }

    // If no specific checks, just check if user is authenticated
    if (checks.length === 0) {
      return !!user;
    }

    // Return based on requireAll flag
    return requireAll ? checks.every(check => check) : checks.some(check => check);
  };

  if (hasAccess()) {
    return children;
  }

  return fallback;
};

export default RoleGuard;