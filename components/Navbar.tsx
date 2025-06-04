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
    <div className={`absolute right-0 h-full w-1/6 backdrop-blur-sm z-10  bg-gray-500/30
    ${isMinimized ? 'w-16' : 'w-1/6'} transition-all duration-300`}>
      <button 
        onClick={toggleMinimize} 
        className={`absolute top-2 left-5  bg-gray-800 hover:bg-gray-500
         text-white rounded-md z-20 ${isMinimized ? 'px-2' : 'px-[6.4rem]'}
         transition-all duration-300`}
      >
        X
      </button>
        
      {!isMinimized && (
        <div className='flex flex-col gap-5 text-xl font-semibold 
        mt-12 items-center w-full'>
            
        <Link href="/" className={`  hover:scale-125 
            ${isMinimized ? 'opacity-0' : 'opacity-100'} transition-all duration-300`}>
          <div> Home</div>
        </Link>

        <Link href="/history" className={`  hover:scale-125 
            ${isMinimized ? 'opacity-0' : 'opacity-100'} transition-all duration-300`}>
        <div> History</div>
        </Link>
        </div>
        )}
    </div>
  );
}