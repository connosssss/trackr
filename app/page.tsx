'use client';

import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";
import { useState, useEffect } from "react";
import { fetchTimeSessions, createTimeSession, updateTimeSession } from "@/utils/timeSessionsDB";

// Define the TimeSession type
interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
}



export default function Home() {


  const { user, isLoading, signOut } = useAuth();
  

  
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeSession | null>(null);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

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

  const startTracking = async () => {
    if (!user) return;
    
    try {
      const tempSession: TimeSession = {
        id: Date.now().toString(), 
        start_time: new Date(),
        end_time: null,
        duration: null
      };
      
      setCurrentSession(tempSession);
      setIsTracking(true);
      setTimer(0);
      
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      setTimerInterval(interval);
      
      const newSession = await createTimeSession({
        user_id: user.id,
        start_time: tempSession.start_time,
        end_time: null,
        duration: null
      });
    
      setCurrentSession(newSession);
    } catch (error) {
      console.error("Error starting tracking:", error);
      setIsTracking(false);
      if (timerInterval) clearInterval(timerInterval);
    }
  };

  const stopTracking = async () => {
    if (!currentSession || !timerInterval || !user) return;
    
    try {
      clearInterval(timerInterval);
      setTimerInterval(null);
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.start_time.getTime()) / 1000);
      
      const completedSession: TimeSession = {
        ...currentSession,
        end_time: endTime,
        duration
      };
      
      await updateTimeSession({
        ...completedSession,
        user_id: user.id
      }
    
    );
      
      const updatedSessions = await fetchTimeSessions(user);
      setSessions(updatedSessions);
      setIsTracking(false);
    } 
    catch (error) {
      console.error("Error stopping tracking:", error);
    }
  };


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="">
        
        {isLoading ? (
          <p>Loading...</p>
        ) : user ? (

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-lg">Logged in as: <span className="font-bold">{user.email}</span></p>

              <button onClick={() => signOut()} className="bg-red-500">
                Sign Out
              </button>
            </div>
            
            <div className="">
              
              <div className="mb-6">
                <div className="text-4xl font-mono mb-4">
                  {formatTime(timer)}
                </div>
                
                <div className="flex space-x-4">
                  {!isTracking ? (
                    <button 
                      onClick={startTracking}
                      className=" text-white "
                    >
                      Start Tracking
                    </button>
                  ) : (
                    <button 
                      onClick={stopTracking}
                      className=" text-white "
                    >
                      Stop Tracking
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Session History</h3>

                {isLoadingSessions ? (

                  <p>Loading sessions...</p>

                ) : sessions.length === 0 ? (

                  <p className="">No sessions recorded yet.</p>

                ) : (

                  <div className="overflow-auto max-h-80">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="">
                        <tr>

                          <th className="">Date</th>

                          <th className="">Start Time</th>

                          <th className="">End Time</th>

                          <th className="">Duration</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">

                        {sessions.map((session) => (
                          <tr key={session.id}>
                            <td className="">
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className="">
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className="">
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className="">
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>

                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className=" w-screen flex items-center justify-center">

            <Login />
          </div>
        )}
    </div>
  );
}
