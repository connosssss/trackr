'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { fetchUserTheme, updateUserTheme } from '@/utils/userSettings';
import { useTheme } from '@/context/ThemeContext';


export default function LoginPage() {
    
    const { user, resetPassword, signOut } = useAuth();
    const router = useRouter();

    const [hasSent, setHasSent] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');

    useEffect(() => {
        if (user) {
            fetchUserTheme(user.id).then(theme => {
                if (theme) setCurrentTheme(theme);
            });
        }
    }, [user]);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/start');
        } 
        
        catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!user?.email) return;
      
      try {
        await resetPassword(user.email);
        console.log('Password reset email sent');
        setHasSent(true);
      } 
      catch (error) {
        console.error('Error resetting password:', error);
      }
    };

    const { updateTheme } = useTheme();

    const handleTheme = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!user) return;
    
        const newTheme = e.target.value;
        setCurrentTheme(newTheme); 
        
        await updateUserTheme(user.id, newTheme);
        await updateTheme(); // Update theme context to trigger navbar update
    };

    return (
        <div className={`${currentTheme === 'default' ? 'bg-[#141318] text-white' : 'bg-[#f2f6fc] text-black'} flex w-full items-center justify-center h-screen`}>
                <Navbar/>
                <div className={`min-w-1/3 min-h-1/2 rounded-md p-12 flex flex-col justify-start items-center gap-6 shadow-md ${currentTheme === 'default' ? 'bg-[#0c0b10] shadow-black' : 'bg-[#f2f6fc] shadow-gray-300'}`}>
            <h2 className='text-xl font-bold text-shadow-2'>
                Email: {user?.email}
            </h2>
             
             <div className="w-full flex flex-col items-center gap-4 mb-4">
                <h3 className="text-lg font-semibold">Theme Settings</h3>
                <p className='text-xs'>{currentTheme === 'default' ? 'Using Default theme' : 'Using Light theme'}</p>
                <select 
                    value={currentTheme}
                    onChange={handleTheme}
                    className={`${currentTheme === 'default' ? 'bg-[#141318] text-white' : 'bg-[#f2f6fc] text-black border'} px-4 py-2 rounded-md w-1/3`}
                >

                    <option value="default">Default</option>
                    <option value="light">Light</option>
                </select>
            </div>

            <button onClick={handleForgotPassword}
                className={`py-2 w-1/3 rounded-md transition-all duration-300 ${currentTheme === 'default' ? 'bg-[#141318] hover:bg-[#2A292E] shadow-md shadow-black text-white' : 'bg-[#aab3bf] hover:bg-[#8a94a1] text-black'}`}>
                Reset Password
            </button>

                
          

            <button onClick={handleSignOut}
                className={`py-2 w-1/3 rounded-md transition-all duration-300 ${currentTheme === 'default' ? 'bg-[#792d2d] hover:bg-[#ba4747] shadow-md shadow-black text-white' : 'bg-[#ba4747] hover:bg-[#792d2d] text-black'}`}>
                Sign Out
            </button> 


            

            {hasSent && <div>Reset email sent!</div>}

        </div>
        
  </div>
  );
}