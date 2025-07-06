'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function StartPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isLogin, setIsLogin] = useState(false);
  const { signIn, signUp, resetPassword, user, isLoading } = useAuth();

  const router = useRouter();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [hasSent, setHasSent] = useState(false);

 
  const [time, setTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);


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


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await resetPassword(resetEmail);
      setHasSent(true);
    } 
    catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <div className="bg-gray-800 w-full h-full">

      <div className='h-screen flex flex-row items-center'>

        {/* clock */}
        
          <div className="relative w-[35rem] h-[35rem] ml-30">
            <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
            
            <div
              className="absolute top-1/2 left-1/2 w-1 h-32 bg-gray-300 origin-bottom transform -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                transform: `translate(-50%, -50%) rotate(${isClient ? (time.getHours() % 12) * 30 + time.getMinutes() / 2 : 0}deg)`,
              }}
            ></div>
            
            <div
              className="absolute top-1/2 left-1/2 w-1 h-42 bg-gray-300 origin-bottom transform -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                transform: `translate(-50%, -50%) rotate(${isClient ? time.getMinutes() * 6 : 0}deg)`,
              }}
            ></div>
            
            
            <div
              className="absolute top-1/2 left-1/2 w-0.5 h-64 bg-gray-300 origin-bottom transform -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                transform: `translate(-50%, -50%) rotate(${isClient ? time.getSeconds() * 6 : 0}deg)`,
              }}
            ></div>
            

            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 "></div>
          </div>



          <div className='flex flex-col px-50 ml-64'> 
            <div className='text-5xl font-semibold '>
              trackr
            </div>

            <div>
              A lightweight and open source time tracking platform for everyone 
            </div>
          </div>
          
        

      </div>

      <div className="h-screen w-full flex flex-col items-center justify-center">


        

       
        {!showForgotPassword ? (
          <div className="flex flex-col w-1/3 bg-gray-700/70 rounded-lg items-center py-14">
            <h2 className="text-4xl font-semibold">{isLogin ? 'Login' : 'Create Account'}</h2>

            {error && <div className="mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="w-3/4 flex flex-col justify-center items-center p-5 mt-5">

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

              <div className="text-center flex flex-col mt-8 w-full">

                <button
                  type="submit"
                  className="bg-white/30 hover:bg-white/20 p-4 rounded w-full transition-all duration-300"
                >

                  {isLogin ? 'Sign In' : 'Sign Up'}

                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }}
                  className="text-md hover:text-blue-200 text-blue-300 underline mt-3 transition-all duration-300"
                >

                  Forgot Password
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
        ) : (

          <div className="flex flex-col w-1/3 bg-gray-700/70 rounded-lg items-center py-14">

            <h2 className="text-4xl font-semibold">Forgot Password</h2>

            {error && <div className="mb-4">{error}</div>}

            <form onSubmit={handleForgotPassword} className="w-3/4 flex flex-col justify-center items-center p-5 mt-5">

              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-2 border focus:outline-none mb-4 rounded"
                placeholder="Email"
                required

              />

              <div className="text-center flex flex-col mt-8 w-full">

                <button
                  type="submit"
                  className="bg-white/30 hover:bg-white/20 p-4 rounded w-full transition-all duration-300"
                >
                  {!hasSent ? 'Send' : 'Sent!'}
                </button>

              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}