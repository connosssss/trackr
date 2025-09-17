'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useState } from 'react'; 


export default function LoginPage() {
    
    const { user, resetPassword, signOut } = useAuth();
    const router = useRouter();

    const [hasSent, setHasSent] = useState(false);

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

  return (
    <div className="flex  bg-[#141318] w-full items-center justify-center h-screen ">
        <Navbar/>
        <div className='min-w-1/3 min-h-1/2 bg-[#0c0b10] rounded-md p-12
        flex flex-col justify-start items-center gap-6 shadow-md shadow-black'>
            <h2 className='text-xl font-bold text-shadow-2'>
                Email: {user?.email}
            </h2>
             

            <button onClick={handleForgotPassword}
                className='py-2 bg-[#141318] hover:bg-[#2A292E] w-1/3 rounded-md shadow-md shadow-black
                transition-all duration-300 '>Reset Password</button>

                
            <button onClick={handleSignOut}
                className='py-2 hover:bg-red-400/30 bg-red-400/50 w-1/3 rounded-md shadow-md shadow-black
                transition-all duration-300 '>Sign Out</button> 


            

            {hasSent && <div>Reset email sent!</div>}

        </div>
        
  </div>
  );
}