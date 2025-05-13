'use client';

import { useAuth } from "@/context/AuthContext";
import Login from "@/components/Login";
import { useState, useEffect } from "react";

// Define the TimeSession type
interface TimeSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
}

export default function Home() {
  const { user, isLoading, signOut } = useAuth();
  
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeSession | null>(null);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  
  useEffect(() => {
    if (user) {
      const savedSessions = localStorage.getItem(`timeSessions_${user.email}`);
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : null
        }));
        setSessions(parsedSessions);
      }
    }
  }, [user]);

  const startTracking = () => {
    const newSession: TimeSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      endTime: null,
      duration: null
    };
    
    setCurrentSession(newSession);
    setIsTracking(true);
    setTimer(0);
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTracking = () => {

    
    if (currentSession && timerInterval) {

      clearInterval(timerInterval);
      setTimerInterval(null);
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
      
      const completedSession: TimeSession = {
        ...currentSession,
        endTime,
        duration
      };
      
      const updatedSessions = [...sessions, completedSession];
      setSessions(updatedSessions);
      setIsTracking(false);
      
      if (user) {
        localStorage.setItem(`timeSessions_${user.email}`, JSON.stringify(updatedSessions));
      }
    }
  };


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
        
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
                {sessions.length === 0 ? (
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

                        {sessions.slice().reverse().map((session) => (
                          <tr key={session.id}>
                            <td className="">
                              {session.startTime.toLocaleDateString()}
                            </td>
                            <td className="">
                              {session.startTime.toLocaleTimeString()}
                            </td>
                            <td className="">
                              {session.endTime ? session.endTime.toLocaleTimeString() : '-'}
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
          <Login />
        )}
    </div>
  );
}
