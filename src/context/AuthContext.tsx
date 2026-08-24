import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  password?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (email: string, password?: string, name?: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, address?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current user from localStorage
    const savedUser = localStorage.getItem('fashion_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string, name?: string): Promise<boolean> => {
    try {
      // Try fetching from Supabase first
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase());

      if (!error && data && data.length > 0) {
        const dbUser = data[0];
        const mappedUser: UserProfile = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone || '',
          address: dbUser.address || '',
          createdAt: dbUser.created_at || dbUser.createdAt || new Date().toISOString(),
          password: dbUser.password || ''
        };

        if (mappedUser.password && password && mappedUser.password !== password) {
          throw new Error('Contraseña incorrecta');
        }

        setCurrentUser(mappedUser);
        localStorage.setItem('fashion_current_user', JSON.stringify(mappedUser));

        // Sync with local fashion_users list
        const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('fashion_users') || '[]');
        const updatedUsers = [mappedUser, ...savedUsers.filter(u => u.id !== mappedUser.id)];
        localStorage.setItem('fashion_users', JSON.stringify(updatedUsers));

        return true;
      }
    } catch (err: any) {
      if (err.message === 'Contraseña incorrecta') throw err;
      console.warn('Supabase auth query failed, falling back to localStorage:', err.message);
    }

    // Fallback to localStorage
    const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('fashion_users') || '[]');
    const existingUser = savedUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      if (existingUser.password && password && existingUser.password !== password) {
        throw new Error('Contraseña incorrecta');
      }
      setCurrentUser(existingUser);
      localStorage.setItem('fashion_current_user', JSON.stringify(existingUser));
      return true;
    } else if (name) {
      // If user doesn't exist but name is provided (auto-register on first social-like login)
      return await register(name, email, undefined, undefined, password);
    }
    return false;
  };

  const register = async (name: string, email: string, phone?: string, address?: string, password?: string): Promise<boolean> => {
    const lowercaseEmail = email.toLowerCase();

    // Check localStorage first
    const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('fashion_users') || '[]');
    let exists = savedUsers.some(u => u.email.toLowerCase() === lowercaseEmail);

    try {
      // Also check Supabase to prevent duplicate register
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', lowercaseEmail);
      if (!error && data && data.length > 0) {
        exists = true;
      }
    } catch (err) {
      console.warn('Supabase exist-check failed, relying on localStorage:', err);
    }

    if (exists) {
      return false; // User already exists
    }

    const newUser: UserProfile = {
      id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
      name,
      email: lowercaseEmail,
      phone,
      address,
      createdAt: new Date().toISOString(),
      password
    };

    // Save to Supabase
    try {
      await supabase.from('profiles').upsert([{
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || '',
        address: newUser.address || '',
        password: newUser.password || '',
        created_at: newUser.createdAt
      }]);
    } catch (err) {
      console.error('Failed to save register to Supabase:', err);
    }

    const updatedUsers = [...savedUsers.filter(u => u.email !== lowercaseEmail), newUser];
    localStorage.setItem('fashion_users', JSON.stringify(updatedUsers));
    setCurrentUser(newUser);
    localStorage.setItem('fashion_current_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fashion_current_user');
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    localStorage.setItem('fashion_current_user', JSON.stringify(updatedUser));

    // Update in users database (local)
    const savedUsers: UserProfile[] = JSON.parse(localStorage.getItem('fashion_users') || '[]');
    const updatedUsers = savedUsers.map(u => u.id === currentUser.id ? updatedUser : u);
    localStorage.setItem('fashion_users', JSON.stringify(updatedUsers));

    // Update in Supabase
    try {
      await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          password: updatedUser.password || ''
        })
        .eq('id', currentUser.id);
    } catch (err) {
      console.error('Failed to update profile in Supabase:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
