'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, createTimeSession, updateTimeSession } from "@/utils/timeSessionsDB";
import { useRouter } from "next/navigation";


import Sessions from "@/components/Sessions";
import Navbar from "@/components/Navbar";

// Define the TimeSession type
interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  group: string | null;
}



export default function Home() {


  const { user, isLoading, signOut } = useAuth();
  
  const router = useRouter();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeSession | null>(null);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);


  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const[hasLoaded, setHasLoaded] = useState(false);
  const[isPaused, setIsPaused] = useState(false);

  const [groupInput, setGroupInput] = useState<string>('');
  const [pastGroups, setpastGroups] = useState<string[]>([]);


  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const loadSessions = async () => {
        setIsLoadingSessions(true);
        try {
          const data = await fetchTimeSessions(user);
          setSessions(data);
          loadPastGroups(data);
        } 
        
        catch (error) {
          console.error("Error loading sessions:", error);
        } finally {
          setIsLoadingSessions(false);
        }
      };
      
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking && !isPaused) {

      interval = setInterval(() => {

        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };

    
  }, [isTracking, isPaused]);

  const loadPastGroups = async (data) => {
    if(!user) return;
    const groupCounts: { [key: string]: number } = {};

          data.forEach(session => {
            if (session.group) {
              groupCounts[session.group] = (groupCounts[session.group] || 0) + 1;
            }
          });
          
          const sortedGroups = Object.entries(groupCounts).sort(([,a], [,b]) => b - a).slice(0, 6).map(([group]) => group);
          
          setpastGroups(sortedGroups);
  }
  const startTracking = async () => {
    if (!user) return;
    
    if(!hasLoaded) setHasLoaded(true);
    try {
      const tempSession: TimeSession = {
        id: Date.now().toString(), 
        start_time: new Date(),
        end_time: null,
        duration: null,
        group: groupInput || null
      };
      
      setCurrentSession(tempSession);
      setIsTracking(true);
      setTimer(0);
      setGroupInput('');
      
     /* const interval = setInterval(() => {
        
        setTimer(prev => prev + 1);
        
      }, 1000);
      
      
      setTimerInterval(interval);
      console.log(interval); */
      
      const newSession = await createTimeSession({
        user_id: user.id,
        start_time: tempSession.start_time,
        end_time: null,
        duration: null,
        group: tempSession.group
      });
    
      setCurrentSession(newSession);
    } catch (error) {
      console.error("Error starting tracking:", error);
      setIsTracking(false);
      if (timerInterval) clearInterval(timerInterval);
    }


    
  };
  

  const stopTracking = async () => {
    if (!currentSession || !user) return;
    
    try {

      
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
      setIsPaused(false);
    } 
    catch (error) {
      console.error("Error stopping tracking:", error);
    }
  };
/*
  const pauseTracking = async () => {
    const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 0);
    setTimerInterval(interval);
    setIsPaused(true);
    
  }
  const unpauseTracking = async () => {
    const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    setTimerInterval(interval);
    setIsPaused(false);
    
  } */

  const selectGroup = (group: string) => {
    setGroupInput(group);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="bg-gray-800 min-h-screen h-full">
        
        <Navbar />

        {isLoading ? (
          <div className="w-full h-full flex justify-center align-center">
          <p>Loading sessions...</p>
        </div>
        ) : user ? (

          <div className="">
            
            
            
              
              <div className=" font-mono  flex h-24 items-center transition duration-300 border-b-2 border-gray-500
              ">
                
                <div className="ml-5 text-4xl">
                  {formatTime(timer)}

                </div>
                {groupInput ? (
                    <div className="text-white text-lg opacity-70 ml-6 ">
                      <span className="font-bold">{groupInput}</span>
                    </div>
                  ) : currentSession && currentSession.group ? (
                  <div className="text-white text-lg opacity-70 ml-6 ">
                      <span className="font-bold">{currentSession.group}</span>
                    </div>) : null}


                {hasLoaded ? <div className={` z-10 fixed w-screen top-0 h-24 bg-red-500/20 ${isTracking ? 'opacity-0' : 'opacity-100'} transition ease-in-out duration-300`}/> : null}
                {hasLoaded ? <div className={` z-10 fixed w-screen top-0 h-24 bg-amber-400/30 ${!isPaused ? 'opacity-0' : 'opacity-100'} transition ease-in-out duration-300`}/> : null}
                </div>

                <div className="flex  py-3 border-b-2 border-gray-500 flex-row gap-2 items-center ">
                  {!isTracking ? ( 
                    <button 
                      onClick={startTracking}
                      className=" text-white bg-gray-700 ml-5 p-2 rounded-md
                       hover:bg-gray-500 transition-all duration-300"
                    >
                      Start Tracking
                    </button>
                  ) : (
                    <button 
                      onClick={stopTracking}
                      className=" text-white bg-gray-700 ml-5 p-2 rounded-md
                       hover:bg-gray-500 transition-all duration-300"
                    >
                      Stop Tracking
                    </button>
                  )}

                  {
                  
                  // Need to make form so clear on start and update historypg
                  
                  
                  !isPaused ? (
                    <button 
                      onClick={() => {setIsPaused(true);}}
                      className=" text-white bg-gray-700 p-2 rounded-md
                       hover:bg-gray-500 transition-all duration-300"
                    >
                        Pause
                    </button>
                  ) : (
                    <button 
                      onClick={() => {setIsPaused(false);}}
                      className=" text-white bg-gray-700 p-2 rounded-md
                       hover:bg-gray-500 transition-all duration-300"
                    >
                      {hasLoaded ? "Unpause" : "Pause"}
                    </button>
                  )}

                  <form onSubmit={handleGroupSubmit} className="flex gap-2 ml-5">
                    <textarea 
                      className="bg-gray-700 text-white p-2 rounded-md h-10 resize-none"
                      value={groupInput}
                      onChange={(e) => setGroupInput(e.target.value)}
                      placeholder="timetracking group"
                    />
                  </form>
                  {pastGroups.length > 0 && pastGroups.slice(0,10).map((group, index) => (
                        <button
                          key={index}
                          onClick={() => selectGroup(group)}
                          className={`px-3 py-2 rounded-md text-sm transition ml-2
                            opacity-75
                            ${
                            groupInput === group 
                              ? 'bg-gray-500 text-white' 
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        >
                          {group}
                        </button>
                      ))
                  
                }
                </div>
              
            


            <div className='h-[34rem] flex items-center mx-5'>
              <Sessions />
               </div>
            
              
              




            

            <div className="flex justify-between items-center">
              <p className="text-lg">Logged in as: <span className="font-bold">{user.email}</span></p>

              <button onClick={() => signOut()} className="bg-red-500">
                Sign Out
              </button>
            </div>
          </div>
        ) : null}
    </div>);
}
