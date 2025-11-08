'use client';


import Link from 'next/link';
import { useState } from 'react'; 
import { useTheme } from "@/context/ThemeContext";

export default function Navbar() {

  const [isMinimized, setIsMinimized] = useState(true);
  const { theme } = useTheme();

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`fixed right-0 h-screen backdrop-blur-sm z-20 ${theme == "default" ? "bg-[#07060a] text-white" : "bg-[#aab3bf] text-gray-800"}
    ${isMinimized ? 'w-16' : 'w-1/6'}  transition-all duration-500 ease-in-out `}>
      <button 
        onClick={toggleMinimize} 
        className={`absolute top-2 ${isMinimized ? 'left-2' : 'left-5'} 
         rounded-md z-30 px-4 ${!isMinimized ? 'w-[80%]' : 'w-12'} mr-2
         ${theme == "default" ? "bg-[#1B1A1F] hover:hover:bg-[#2A292E] text-white" : "bg-[#8a94a1] hover:bg-[#6a7685] text-gray-800"}
          duration-500 ease-in-out`}
      >
        {isMinimized ? '→' : '←'}
      </button>
        
      <div className={`flex flex-col gap-5 text-xl font-semibold 
        mt-12 items-center w-full transition-all duration-500 ease-in-out
        ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
        <Link href="/" className="hover:scale-125 transition-all duration-300 z-30">
          <div>Home</div>
        </Link>

        <Link href="/history" className="hover:scale-125 transition-all duration-300 z-30">
          <div>History</div>
        </Link>

        <Link href="/statistics" className="hover:scale-125 transition-all duration-300 z-30">
          <div>Statistics</div>
        </Link>

        <Link href="/graphs" className="hover:scale-125 transition-all duration-300 z-30">
          <div>Graphs</div>
        </Link>
        
        <Link href="/user" className="hover:scale-125 transition-all duration-300 z-30">
          <div>Settings</div>
        </Link>
      </div>
    </div>
  );
}