'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp } = useAuth();

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
    <div className="flex flex-col bg-gray-800 w-1/4 items-center rounded-lg py-5">
      <h2 className="text-2xl font-semibold">{isLogin ? 'Login' : 'Create Account'}</h2>
      
      {error && (
        <div className="mb-4 ">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className='w-2/3 flex flex-col justify-center items-center p-5 mt-5'>
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
        
        <button
          type="submit"
          className="bg-white/30 hover:bg-white/20 p-2 rounded"
        >
          {isLogin ? 'Sign In' : 'Sign Up'}
        </button>
        
        <div className="text-center mt-16">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
        
      </form>
    </div>
  );
}