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
<div className=" bg-gray-800 h-screen" >

                {isLoadingSessions ? (

                  <p>Loading sessions...</p>

                ) : sessions.length === 0 ? (

                  <p className="">No sessions recorded yet.</p>

                ) : (
                    


                  <div className=" flex flex-col items-center ">
                    <h1 className='text-xl font-semibold'> History</h1>
                    <table className="w-full divide-y divide-gray-200 text-md ">
                      <thead className="">
                        <tr>

                          <th className="">Date</th>

                          <th className="">Start Time</th>

                          <th className="">End Time</th>

                          <th className="">Duration</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y  divide-gray-200">

                        {
                        sessions.map((session) => (
                          <tr key={session.id} className="py-5">
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
                    
                  </div>
                )}
              </div> 
 
  );
}