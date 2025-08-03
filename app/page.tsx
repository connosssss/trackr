'use client';

import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect } from "react";
import { fetchTimeSessions, createTimeSession, updateTimeSession } from "@/utils/timeSessionsDB";
import { useRouter } from "next/navigation";
import {updateGroupList} from "@/utils/timeSessionsDB";


import Sessions from "@/components/Sessions";
import Navbar from "@/components/Navbar";
import Edit from "@/components/Edit";

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

  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [isEditing, setIsEditing] = useState(false);
  const [editingSession, setEditingSession] = useState<TimeSession | null>();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const loadSessions = async () => {
        setIsLoadingSessions(true);
        try {
          const data = await fetchTimeSessions(user);
          setSessions(data);
          loadPastGroups(data);
          
          const activeSession = data.find(session => !session.end_time);
          if (activeSession) {
            setCurrentSession(activeSession);
            setIsTracking(true);
          }
        } 
        
        catch (error) {
          console.error("Error loading sessions:", error);
        } finally {
          setIsLoadingSessions(false);
        }
      };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/start');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking && currentSession) {

      const updateTimer = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSession.start_time.getTime()) / 1000);
        setTimer(elapsed);
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentSession]);

  const loadPastGroups = async (data: TimeSession[]) => {
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
    
    setIsTracking(true);
    if(!hasLoaded) setHasLoaded(true);

    try {
      const newSession = await createTimeSession({
        user_id: user.id,
        start_time: new Date(),
        end_time: null,
        duration: null,
        group: groupInput || null
      });
    
      setCurrentSession(newSession);
      
      setGroupInput('');

    } 

    catch (error) {
      console.error("Error starting tracking:", error);
      setIsTracking(false);

    }
  };
  

  const stopTracking = async () => {
    if (!currentSession || !user) return;
    
    try {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.start_time.getTime()) / 1000);
      
      const completedSession: TimeSession = {
        ...currentSession,
         user_id: user.id,
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
      
      setTimer(duration);
      
      setCurrentSession(null);
    } 
    
    catch (error) {
      console.error("Error stopping tracking:", error);
    }

    try{
      await updateGroupList(user);
    }
    catch(error){
      console.error("Error updating group database:", error);
    }
  };

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



  const handleMouseEnter = (sessionId: string, event: React.MouseEvent) => {
    setHoveredSession(sessionId);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredSession(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredSession) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditingSession(null);
    };


  const handleSaveComplete = async (updatedSession: TimeSession) => {
      await loadSessions();
      setIsEditing(false);
      setEditingSession(null);
    };



  const getWeek = () => {
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const changeWeek = (direction: 'before' | 'later') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'later' ? 7 : -7));
    setCurrentWeekStart(newWeekStart);
  };

  const formatDateHeader = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    const dateNum = date.getDate();
    return `${dayName} ${dateNum}`;
  };

  const formatWeekRange = () => {
    const weekDates = getWeek();
    const start = weekDates[0];
    const end = weekDates[6];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } 
    
    else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const getSessionsForWeek = () => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return sessions.filter(session => {
      const sessionStart = new Date(session.start_time);
      const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();
      return (sessionStart <= weekEnd && sessionEnd >= weekStart) && session.end_time;
    });
  };

  const getActiveSessions = () => {
    //easy null check + if need more
    if (!isTracking || !currentSession) return [];

    return [currentSession];
  };
  

  const getSessionsC = (session: TimeSession) => {

    const weekDates = getWeek();
    const sessionStart = new Date(session.start_time);
    const sessionEnd = session.end_time ? new Date(session.end_time) : new Date();
    
    const sessions = [];
    
    for (let i = 0; i < weekDates.length; i++) {
      const dayStart = new Date(weekDates[i]);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(weekDates[i]);
      dayEnd.setHours(23, 59, 59, 999);
      
      if (sessionStart <= dayEnd && sessionEnd >= dayStart) {
        const segmentStart = sessionStart > dayStart ? sessionStart : dayStart;
        const segmentEnd = sessionEnd < dayEnd ? sessionEnd : dayEnd;
        
        const startHour = segmentStart.getHours();
        const startMinute = segmentStart.getMinutes();
        const endHour = segmentEnd.getHours();
        const endMinute = segmentEnd.getMinutes();
        
        const startPosition = (startHour + startMinute / 60) * 64;
        const endPosition = (endHour + endMinute / 60) * 64;
        
        sessions.push({
          dayIndex: i,
          top: startPosition,
          height: Math.max(endPosition - startPosition, 8),
          left: ((i + 1) / 8) * 100,
          width: (1 / 8) * 100
        });
      }
    }
    
    return sessions;
  };


  return (
    <div className="bg-gray-900 min-h-screen h-full w-full">
      {isEditing && editingSession && (
              <Edit
                editingSession={editingSession}
                onCancel={handleCancelEdit}
                onSave={handleSaveComplete}
                user={user}
              />
            )}
        
        <Navbar />

        {isLoading ? (
          <div className="w-full h-full flex justify-center align-center">
          <p>Loading sessions...</p>
        </div>
        ) : user ? (

          <div className="">
            
            
            
              
              <div className=" font-mono  flex h-24 items-center transition duration-300 border-b-2 border-gray-600 bg-gray-800/50
                 w-full">
                
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


                {hasLoaded ? <div className={` z-10 absolute  top-0 h-24 ${isTracking ? 'opacity-0' : 'opacity-100'} bg-red-500/20  
                transition ease-in-out duration-300 w-[99%]`}/> : null}
                
                </div>

                <div className="flex  py-3 border-b-2 border-gray-600 flex-row gap-2 items-center w-full bg-gray-800/50 shadow-lg shadow-indigo-900/20">
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

                <div className="flex justify-start gap-3 items-center py-3 w-[93%] mx-5 mt-3">
                  <button 
                      onClick={() => changeWeek('before')}
                      className="text-white bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-500 transition-all duration-300"
                    >
                      ← </button>
                      
                      <button 
                      onClick={() => changeWeek('later')}
                      className="text-white bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-500 transition-all duration-300"
                    > →</button>

                <div className="text-white text-lg font-medium pr-5 min-w-52 ">

                    {formatWeekRange()}
                  </div>
                    
                    
                  
                  
                </div>
              
            


            <div className='h-full flex flex-col pb-20 mx-5 '>
                <div className='grid grid-flow-col grid-cols-8 w-[95%] border-gray-600 mr-16'>
                  <div className="text-white/40 text-xs border-b flex justify-center items-end "> 12:00 AM</div>

                  {getWeek().map((date, index) => (
                    <div key={index} className=' border-gray-600 border-b h-12 text-white/30 
                    text-center flex items-end justify-center'>
                        <div>{formatDateHeader(date)}</div>
                      
                    </div>
                    
                  )) }
                  </div>
                  
                  <div className='grid grid-cols-8 w-[95%] relative'>
                    {Array.from({ length: 24 }, (_, hour) => (
                     
                     <React.Fragment key={hour}>

                        <div  className='border-gray-500 border-b border-r h-16 flex justify-center items-end'>
                          <div className="text-white/40 text-xs mb-1 ">{
                          hour === 0 ? '1:00 AM' :
                          hour < 11 ? `${hour + 1}:00 AM` : 
                          hour === 11 ? '12:00 PM' : 
                          hour === 23 ? '12:00 AM' :
                          `${hour + 1 - 12}:00 PM`}
                          </div>
                        </div>


                        {getWeek().map((date, dayIndex) => (
                          
                          <div 
                            key={`${dayIndex}-${hour}`} 
                            className='border-gray-500 border-b border-r h-16 relative'
                          >
                           


                          </div>
                        ))}
                        </React.Fragment>
                      ))}

                      {getSessionsForWeek().map((session) => {
                        const sessions = getSessionsC(session);
                        return sessions.map((segment, segmentIndex) => (

                          <div
                            key={`${session.id}-${segmentIndex}`}

                            className="absolute bg-gradient-to-br from-gray-700 to-gray-700/70 rounded-sm px-1  text-white overflow-hidden
                            flex flex-col py-2 cursor-pointer hover:from-gray-600/90 hover:to-gray-600/60  transition-colors"

                            style={{
                              
                              left: `${segment.left}%`,
                              width: `${segment.width - 0.2}%`,
                              top: `${segment.top}px`,
                              height: `${segment.height}px`,
                              marginLeft: '1px',
                              marginRight: '1px'

                            }}

                            onMouseEnter={(e) => handleMouseEnter(session.id, e)}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}

                            onClick={() => {
                              setEditingSession(session)
                              setIsEditing(true);
                            }}

                          >
                              <div className='text-sm'> {session.group}</div>
                              <div className='text-xs'> {session.duration ? formatTime(session.duration) : ''}</div>
                          </div>
                        ));
                      }).flat()}

                      {getActiveSessions().map((session) => {

                        const sessions = getSessionsC(session);

                        return sessions.map((segment, segmentIndex) => (
                          <div
                            key={`active-${session.id}-${segmentIndex}`}


                            className="absolute bg-cyan-700/90 rounded-sm px-1  text-white overflow-hidden
                            flex flex-col py-2 cursor-pointer hover:bg-cyan-600/90 transition-colors"

                            style={{
                              left: `${segment.left}%`,
                              width: `${segment.width - 0.2}%`,
                              top: `${segment.top}px`,
                              height: `${segment.height}px`,
                              marginLeft: '1px',
                              marginRight: '1px' }}

                            onMouseEnter={(e) => handleMouseEnter(session.id, e)}
                            onMouseLeave={handleMouseLeave}
                            onMouseMove={handleMouseMove}

                          >
                              <div className='text-sm'> {session.group}</div>
                              <div className='text-xs'> Active</div>
                          </div>
                        ));
                      }).flat()}

                      </div>

              </div>
          </div>
        ) : null}





        {hoveredSession && (

          <div className="fixed z-50 bg-gray-800/80 text-white px-3 py-2 rounded-md text-sm pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
            }}
            >

            {(() => {
              const session = sessions.find(s => s.id === hoveredSession);
              const isActiveSession = currentSession && currentSession.id === hoveredSession;
              

              return session ? (
                <div>

                  <div className="font-semibold">{session.group || 'No Group'}</div>
                  
                  <div className="text-xs opacity-75">
                    {isActiveSession ? formatTime(timer) : (session.duration ? formatTime(session.duration) : 'No duration')}
                  </div>

                </div>
              ) : null;
            }) ()}

          </div>
        )}
    </div>
    );
}
