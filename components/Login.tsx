'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
    
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError(null);
    
    try {
      await signIn(email, password);
    } 
    
    catch (error) {
      setError((error as Error).message);
    }

  };

  return (
    <div className="w-full">
      <h2 className="mb-6">Login</h2>
      
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
            required
          />
        
          
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border focus:outline-none mb-4"
            required
          />
        
        
        <button
          type="submit"
          className="bg-gray-700"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}