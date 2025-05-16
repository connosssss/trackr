'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, user, isLoading } = useAuth();

  
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isLogin) {
        await signIn(email, password);
      } 
      else {
        await signUp(email, password);
      }
    } 
    
    catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="flex  bg-gray-800 w-full items-center justify-center h-screen ">
   <div className='flex flex-col w-1/3  bg-gray-700/70 filter  rounded-lg items-center py-14 '>
     <h2 className="text-4xl font-semibold  ">{isLogin ? 'Login' : 'Create Account'}</h2>
    
    {error && (
      <div className="mb-4 ">
        {error}
      </div>
    )}
    
    <form onSubmit={handleSubmit} className='w-3/4 flex flex-col justify-center items-center p-5 mt-5'>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border focus:outline-none mb-4 rounded"
        placeholder="Email"
        required
      />
      
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border focus:outline-none mb-4 rounded"
        placeholder="Password"
        required
      />
      
      
      
      <div className="text-center  flex flex-col mt-8 w-full ">
        <button
        type="submit"
        className="bg-white/30 hover:bg-white/20 p-4 rounded w-full transition-all duration-300"
      >
        {isLogin ? 'Sign In' : 'Sign Up'}
      </button>
        <button 
          type="button" 
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-md hover:text-blue-200 text-blue-300 underline mt-3 transition-all duration-300"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </div>
      
    </form>
   </div>
  </div>
  );
}
