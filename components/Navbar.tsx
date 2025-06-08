'use client';

// import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useState } from 'react'; 


export default function Navbar() {

  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`absolute right-0 h-full backdrop-blur-sm z-10 bg-gray-500/30
    ${isMinimized ? 'w-18' : 'w-1/6'} transition-all duration-500 ease-in-out`}>
      <button 
        onClick={toggleMinimize} 
        className={`absolute top-2 ${isMinimized ? 'left-2' : 'left-5'} bg-gray-800 hover:bg-gray-500
         text-white rounded-md z-20 ${isMinimized ? 'px-2' : 'px-4 w-[80%]'}
         transition-all duration-500 ease-in-out`}
      >
        {isMinimized ? '→' : '←'}
      </button>
        
      <div className={`flex flex-col gap-5 text-xl font-semibold 
        mt-12 items-center w-full transition-all duration-500 ease-in-out
        ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
        <Link href="/" className="hover:scale-125 transition-all duration-300">
          <div>Home</div>
        </Link>

        <Link href="/history" className="hover:scale-125 transition-all duration-300">
          <div>History</div>
        </Link>
      </div>
    </div>
  );
}