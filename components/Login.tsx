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
    <div className="w-full">
      <h2 className="mb-6">{isLogin ? 'Login' : 'Create Account'}</h2>
      
      {error && (
        <div className="mb-4 ">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border focus:outline-none mb-4"
          placeholder="Email"
          required
        />
        
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border focus:outline-none mb-4"
          placeholder="Password"
          required
        />
        
        <button
          type="submit"
          className="bg-gray-700"
        >
          {isLogin ? 'Sign In' : 'Sign Up'}
        </button>
        
        <div className="text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
        
      </form>
    </div>
  );
}