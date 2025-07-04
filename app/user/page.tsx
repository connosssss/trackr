'use client';

import { useAuth } from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";


export default function LoginPage() {
    
    const { user, isLoading, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } 
        
        catch (error) {
            console.error('Error signing out:', error);
        }
    };

  return (
    <div className="flex  bg-gray-800 w-full items-center justify-center h-screen ">
        <Navbar/>
        <div className='min-w-1/3 min-h-1/2 bg-gray-600 rounded-md shadow p-12
        flex flex-col justify-center items-center gap-20'>
            <h2 className='text-xl font-bold text-shadow-2'>
                Email: {user?.email}
            </h2>
             
            <button onClick={handleSignOut}
                className='px-10 py-4 hover:bg-red-900 bg-red-800 w-1/3 rounded-md 
                transition-all duration-300'>Sign Out</button>
        </div>
        
  </div>
  );
}