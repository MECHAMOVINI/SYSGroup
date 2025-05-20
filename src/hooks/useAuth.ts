import { useContext } from 'react';
import { AuthContext, AuthContextData } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext<AuthContextData>(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 