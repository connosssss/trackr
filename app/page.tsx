'use client';

import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect } from "react";
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



  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const[hasLoaded, setHasLoaded] = useState(false);


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
    
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSession.start_time.getTime()) / 1000);
        setTimer(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentSession]);

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
      setGroupInput('');
      
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
      setTimer(0);
      setCurrentSession(null);
      //setIsPaused(false);
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
  const daysOfWeek = [ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];



  return (
    <div className="bg-gray-800 min-h-screen h-full w-full">
        
        <Navbar />

        {isLoading ? (
          <div className="w-full h-full flex justify-center align-center">
          <p>Loading sessions...</p>
        </div>
        ) : user ? (

          <div className="">
            
            
            
              
              <div className=" font-mono  flex h-24 items-center transition duration-300 border-b-2 border-gray-500
                 w-[98%]">
                
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


                {hasLoaded ? <div className={` z-10 absolute  top-0 h-24 bg-red-500/20 ${isTracking ? 'opacity-0' : 'opacity-100'} 
                transition ease-in-out duration-300 w-[99%] rounded-bl-2xl`}/> : null}
                
                </div>

                <div className="flex  py-3 border-b-2 border-gray-500 flex-row gap-2 items-center w-[98%]">
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
              
            


            <div className='h-full flex flex-col pb-20 mx-5 mt-5'>
                <div className='grid grid-flow-col grid-cols-8 w-[95%] border-gray-500 mr-16'>
                  <div className="text-white/40 text-xs border-b flex justify-center items-end "> 12:00 AM</div>
                  {daysOfWeek.map((day) => (
                    <div key={day} className=' border-gray-500 border-b h-12 
                    text-center'>
                        {day}
                      
                    </div>
                    
                  )) }
                  </div>
                  
                  <div className='grid grid-cols-8 w-[95%]'>
                    {Array.from({ length: 23 }, (_, hour) => (
                     
                     <React.Fragment key={hour}>

                        <div  className='border-gray-500 border-b border-r h-12 flex justify-center items-end'>
                          <div className="text-white/40 text-xs mb-1 ">{
                          hour < 11 ? `${hour + 1}:00 AM` : 
                          hour === 11 ? '12:00 PM' : 
                          `${hour + 1 - 12}:00 PM`}
                          </div>
                        </div>


                        {daysOfWeek.map((day) => (
                          
                          <div 
                            key={`${day}-${hour}`} 
                            className='border-gray-500 border-b border-r h-12
                            '
                          >
                           


                          </div>
                        ))}
                        </React.Fragment>
                      ))}

                      </div>

              </div>
          </div>
        ) : null}
    </div>);
}
