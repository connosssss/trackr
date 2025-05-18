'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, createTimeSession, updateTimeSession } from "@/utils/timeSessionsDB";


interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
}


export default function HistoryPage() {


    const { user, isLoading, signOut } = useAuth();

    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [sessions, setSessions] = useState<TimeSession[]>([]);

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
<div className=" bg-gray-800 h-full pb-20" >
<h1 className='text-xl font-semibold w-full py-5 text-center'> History</h1>
                {isLoadingSessions ? (

                  <p>Loading sessions...</p>

                ) : sessions.length === 0 ? (

                  <p className="">No sessions recorded yet.</p>

                ) : (
                  <div>
                    
                    

                  <div className=" w-11/12 mx-auto rounded-md shadow-lg bg-amber-100 overflow-hidden ">
                    
                    <table className="w-full divide-y divide-gray-200 text-md ">
                      <thead className="bg-gray-600 rounded-t-2xl">
                        <tr>

                        <th scope="col" className="py-4 ">Date</th>

                          <th scope="col" className="py-4 ">Start Time</th>

                          <th scope="col" className="py-4 ">End Time</th>

                          <th scope="col" className="py-4 ">Duration</th>

                        </tr>
                      </thead>
                      <tbody className="bg-gray-700 divide-y divide-gray-600">

                        {
                        sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-600 transition duration-300">
                            <td className="text-center py-5 text-gray-300">
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>

                          </tr>
                        ))
                        
                        }
                      </tbody>

                    </table>
                    
                  </div>
                </div>)}
              </div> 
            
 
  );
}