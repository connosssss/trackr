"use client";

import { useState } from 'react'; 

export default function LoginPage() {

    const [totalTime, setTotalTime] = useState<number>(0);
    
    

  return (
    <div className="min-h-screen w-screen bg-gray-800">
        <h1 className="w-full text-2xl text-center pt-5">Statistics</h1>
        
        <div className="w-5/6 mx-auto bg-gray-700 min-h-96 rounded-md shadow-md p-14 mt-12 
        flex flex-row">
            <div className='w-1/4 h-1/4 bg-gray-600 flex flex-col text-center gap-5'>
                <div >
                    Total Time
                </div>
                <div>
                    {totalTime}
                </div>
            </div>
            
        </div>
    </div>
  );
}