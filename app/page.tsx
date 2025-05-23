'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, createTimeSession, updateTimeSession } from "@/utils/timeSessionsDB";
import { useRouter } from "next/navigation";


import Sessions from "@/components/Sessions";

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

  const [tempGroupState, setTempGroupState] = useState<string | null>(null);


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



  const startTracking = async () => {
    if (!user) return;
    
    if(!hasLoaded) setHasLoaded(true);
    try {
      const tempSession: TimeSession = {
        id: Date.now().toString(), 
        start_time: new Date(),
        end_time: null,
        duration: null,
        group: tempGroupState
      };
      
      setCurrentSession(tempSession);
      setIsTracking(true);
      setTimer(0);
      
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


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 h-screen">
        
        {isLoading ? (
          <p>Loading...</p>
        ) : user ? (

          <div className="">
            
            
            
              
              <div className="text-4xl font-mono  flex h-24 items-center transition duration-300 border-b-2 border-gray-500
              ">
                
                <div className="ml-5">
                  {formatTime(timer)}
                </div>
                {hasLoaded ? <div className={` z-10 fixed w-screen top-0 h-24 bg-red-500/20 ${isTracking ? 'opacity-0' : 'opacity-100'} transition ease-in-out duration-300`}/> : null}
                {hasLoaded ? <div className={` z-10 fixed w-screen top-0 h-24 bg-amber-400/30 ${!isPaused ? 'opacity-0' : 'opacity-100'} transition ease-in-out duration-300`}/> : null}
                </div>

                <div className="flex  py-3 border-b-2 border-gray-500 flex-row gap-2 ">
                  {!isTracking ? ( 
                    <button 
                      onClick={startTracking}
                      className=" text-white bg-gray-700 ml-5 p-2 rounded-md
                       active:bg-gray-500"
                    >
                      Start Tracking
                    </button>
                  ) : (
                    <button 
                      onClick={stopTracking}
                      className=" text-white bg-gray-700 ml-5 p-2 rounded-md
                       active:bg-gray-500"
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
                       active:bg-gray-500"
                    >
                        Pause
                    </button>
                  ) : (
                    <button 
                      onClick={() => {setIsPaused(false);}}
                      className=" text-white bg-gray-700 p-2 rounded-md
                       active:bg-gray-500"
                    >
                      {hasLoaded ? "Unpause" : "Pause"}
                    </button>
                  )}

                  <textarea className="bg-gray-700 text-white p-2 rounded-md ml-5"
                  value={tempGroupState || ''}
                  onChange={(e) => setTempGroupState(e.target.value)}
                  placeholder="timetracking group">


                    </textarea>
                </div>
              
            


            <div className='h-[34rem] flex items-center justify-center'>
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
