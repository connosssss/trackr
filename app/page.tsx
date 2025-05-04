'use client';

import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";

export default function Home() {
  
  const { user, isLoading, signOut } = useAuth();

  return (
    <div className="">
        
        {isLoading ? (
          <p>Loading...</p>
        ) : user ? (
          <div className="">
            <p className="text-lg">Logged in as: <span className="font-bold">{user.email}</span></p>

            <button onClick={() => signOut()} className="bg-red-500 ">
              Sign Out
            </button>
          </div>
        ) : (
          <Login />
        )}
    </div>
  );
}
