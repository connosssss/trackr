'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserTheme } from '@/utils/userSettings';
import { useAuth } from './AuthContext';



type ThemeContextType = {
  theme: string;
  updateTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  updateTheme: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {

  const [theme, setTheme] = useState('default');
  const { user } = useAuth();

  const updateTheme = async () => {

    if (!user) {
      setTheme('default');
      return;
    }

    try {
      const data = await fetchUserTheme(user.id);
      if (data) setTheme(data);

    } 
    
    catch (err) {
      console.error('Error in loading theme:', err);
    }
  };

  useEffect(() => {
    updateTheme();

  }, [user]);

  return (

    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>

  );
}