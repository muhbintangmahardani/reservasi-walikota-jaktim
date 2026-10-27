'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../domain/entities/UserProfile';
import { getUserRepository } from '../../infrastructure/repositories';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  updateCurrentUser: (updated: Partial<UserProfile>) => void;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const setAuthCookie = (user: UserProfile) => {
  if (typeof document !== 'undefined') {
    const session = {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      unitName: user.unitName,
    };
    document.cookie = `e_reservasi_auth=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
};

export const clearAuthCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'e_reservasi_auth=; path=/; max-age=0; SameSite=Lax';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUsers = async () => {
      const userRepo = getUserRepository();
      const users = await userRepo.getAllUsers();
      setAllUsers(users);

      // Check stored user session from localStorage
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('e_reservasi_active_user') : null;
      if (savedUserId) {
        let matched = users.find((u) => u.id === savedUserId);
        // Seamless migration if old non-UUID ID was stored in previous session
        if (!matched) {
          if (savedUserId === 'user-normal-1' || savedUserId.includes('normal')) {
            matched = users.find((u) => u.email === 'budi@jakarta.go.id') || users[0];
          } else if (savedUserId === 'user-asisten-1' || savedUserId.includes('asisten')) {
            matched = users.find((u) => u.email === 'aspem@jakarta.go.id');
          } else if (savedUserId === 'user-pimpinan-1' || savedUserId.includes('pimpinan')) {
            matched = users.find((u) => u.email === 'walikota@jakarta.go.id');
          } else if (savedUserId === 'user-admin-1' || savedUserId.includes('admin')) {
            matched = users.find((u) => u.email === 'admin.kominfotik@jakarta.go.id');
          }
        }

        if (matched) {
          setCurrentUser(matched);
          setAuthCookie(matched);
          localStorage.setItem('e_reservasi_active_user', matched.id);
        } else {
          setCurrentUser(null);
          clearAuthCookie();
          localStorage.removeItem('e_reservasi_active_user');
        }
      } else {
        setCurrentUser(null);
        clearAuthCookie();
      }
      setIsLoading(false);
    };
    initUsers();
  }, []);

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('e_reservasi_active_user', user.id);
      setAuthCookie(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('e_reservasi_active_user');
      clearAuthCookie();
    }
  };

  const refreshUsers = async () => {
    const userRepo = getUserRepository();
    const users = await userRepo.getAllUsers();
    setAllUsers(users);
    if (currentUser) {
      const refreshed = users.find((u) => u.id === currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
        setAuthCookie(refreshed);
      }
    }
  };

  const updateCurrentUser = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser: UserProfile = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setAuthCookie(updatedUser);
  };

  const switchUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      login(user);
    }
  };

  const switchRole = (role: UserRole) => {
    const user = allUsers.find((u) => u.role === role);
    if (user) {
      login(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchUser,
        switchRole,
        updateCurrentUser,
        refreshUsers,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
