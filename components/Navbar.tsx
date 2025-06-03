'use client';

// import { useRouter } from "next/navigation";
import Link from 'next/link';


export default function Navbar() {


  return (
    <div className="absolute right-0 h-full w-1/6 backdrop-blur-sm z-10  bg-red-400/30
    ">
        <div className='flex flex-col gap-5 text-xl font-semibold 
        mt-5 items-center w-1/2 ml-5'>
        <Link href="/" className="  hover:scale-125 transition-all duration-300">
          <div> Home</div>
        </Link>

        <Link href="/history" className='hover:scale-125 transition-all duration-300'>
        <div> History</div>
        </Link>
        </div>
        
    </div>
  );
}