'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions } from "@/utils/timeSessionsDB";
import { useRouter } from "next/navigation";


interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
}

export default function Sessions() {

    const { user} = useAuth();
  
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [sessions, setSessions] = useState<TimeSession[]>([]);
  

    const router = useRouter();


    useEffect(() => {
      if (user) {
        const loadSessions = async () => {
              setIsLoadingSessions(true);
              try {
                const data = await fetchTimeSessions(user);
                setSessions(data);
              } catch (error) {
                console.error("Error loading sessions:", error);
              } finally {
                setIsLoadingSessions(false);
              }
            };
            
            loadSessions();
          }
        }, [user]);
  
        const formatTime = (seconds: number) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

  return (
    <div className=" bg-gray-700 w-1/3 h-96 rounded-2xl pt-2" >
                <h3 className="text-xl text-center font-semibold mb-3">Session History</h3>

                {isLoadingSessions ? (

                  <p>Loading sessions...</p>

                ) : sessions.length === 0 ? (

                  <p className="">No sessions recorded yet.</p>

                ) : (

                  <div className=" max-h-80 flex flex-col items-center">
                    <table className="w-full divide-y divide-gray-200 text-md ">
                      <thead className="">
                        <tr>

                          <th className="">Date</th>

                          <th className="">Start Time</th>

                          <th className="">End Time</th>

                          <th className="">Duration</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y  divide-gray-200 overflow-hidden max-h-52">

                        {
                        sessions.slice(0,10).map((session) => (
                          <tr key={session.id}>
                            <td className="text-center">
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className="text-center">
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className="text-center">
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className="text-center">
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>

                          </tr>
                        ))
                        
                        }
                      </tbody>

                    </table>
                    
                    <button  onClick={() => {router.push('/history');}}className='w-1/2 text-white font-semibold text-md text-center
                    mt-2 bg-white/30 hover:bg-white/20 w-1/2 rounded-sm'>
                          See all
                    </button>
                  </div>
                )}
              </div>
  );
}