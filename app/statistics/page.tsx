"use client";

import { useState, useEffect  } from 'react'; 
import { useAuth } from "@/context/AuthContext";
import { fetchTimeSessions, fetchGroupList, updateGroupList, GroupStat } from "@/utils/timeSessionsDB";

import Navbar from "@/components/Navbar";

interface Session {
    id: string;
    user_id?: string;
    start_time: Date;
    end_time: Date | null;
    duration: number | 0;
    group: string | null;
  }


export default function LoginPage() {

    const { user } = useAuth();

    const [totalTime, setTotalTime] = useState<number>(0);
    const [groupList, setgroupList] = useState<GroupStat[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingStats, setIsUpdatingStats] = useState(false);
    const [weekTime, setWeekTime] = useState<number>(0);
    const [monthTime, setMonthTime] = useState<number>(0);
    const [yearTime, setYearTime] = useState<number>(0);
    
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };


      const loadSessions = async () => {
        setIsLoading(true);
        if (!user) return;

        try {
            const temp = await fetchTimeSessions(user);
            setTotal(temp);
            calculatePeriodTimes(temp);
           }
           catch (error) {
            console.error('Error loading sessions:', error);
           }
           finally {
            setIsLoading(false);
           }
      };

    const loadGroupList = async () => {
        if (!user) return;

        try {

            setIsUpdatingStats(true);
            await updateGroupList(user);
  
            const stats = await fetchGroupList(user);
            setgroupList(stats);
        }
        catch (error) {
            console.error('Error loading group statistics:', error);
        }
        finally {
            setIsUpdatingStats(false);
        }
    };

    const setTotal = (sessions: Session[]) => {
        const total = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        setTotalTime(total);
      };
      
    const calculatePeriodTimes = (sessions: Session[]) => {
        const now = new Date();
        
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        
        const yearStart = new Date(now);
        yearStart.setFullYear(now.getFullYear() - 1);
        
        const weekTotal = sessions.reduce((sum, session) => {

            if (session.start_time >= weekStart && session.duration) {
                return sum + session.duration;
            }
            return sum;

        }, 0);
        
        const monthTotal = sessions.reduce((sum, session) => {

            if (session.start_time >= monthStart && session.duration) {
                return sum + session.duration;
            }
            return sum;

        }, 0);
        
        const yearTotal = sessions.reduce((sum, session) => {

            if (session.start_time >= yearStart && session.duration) {
                return sum + session.duration;
            }
            return sum;

        }, 0);
        
        setWeekTime(weekTotal);
        setMonthTime(monthTotal);
        setYearTime(yearTotal);
    };

      useEffect(() => {
        if (user) {
          loadSessions();
            loadGroupList();
        }
      }, [user]);


  return (
    <div className="min-h-screen w-screen bg-gray-800">
      <Navbar/>
        <h1 className="w-full text-2xl text-center pt-5">Statistics</h1>
        
        <div className="w-5/6 mx-auto bg-gray-700 min-h-96 rounded-md shadow-md p-14 mt-12 
        flex flex-row gap-8">
            <div className='w-1/4 bg-gray-600 text-center rounded-md shadow-md'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-700'>
                    Total Time
                </div>
                {
                    isLoading ? (
                        <div>Loading...</div>
                    ) : (
                  <div className="h-full w-full flex flex-col gap-9 mt-10">
                  <div className='text-2xl font-semibold text-shadow-2xs hover:scale-120 transition-all duration-300'>
                      {formatTime(totalTime)} Hours
                  </div>

                  <div className='text-lg font-semibold text-shadow-2xs transition-all duration-300
                  flex flex-col gap-2 mx-auto text-center opacity-75'>
                    <div className='flex flex-row gap-2 text-center w-full justify-center'>
                      <p>{Math.floor(totalTime / 86400)} Days</p>
                      <p>{Math.floor((totalTime % 86400)/3600)} Hours</p>
                      </div>
                      <div className='flex flex-row gap-2 text-center w-full justify-center'>
                      <p>{Math.floor((totalTime % 3600) / 60)} Minutes</p>
                      <p>{Math.floor(totalTime % 60)} Seconds</p>
                  </div>
                  </div>
                </div>
                    )
                }
            </div>

            <div className='w-1/2 bg-gray-600 text-center rounded-md shadow-md'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-700'>
                    Top Groups
                </div>
                {
                    isUpdatingStats ? (
                        <div>Loading...</div>
                    ) : groupList.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <p>No group statistics available</p>
                        </div>

                    ) : (
                      
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-4">

                                {groupList.slice(0,3).map((stat, index) => (
                                    <div key={stat.id} 
                                         className={`p-4 rounded-lg transition-all duration-300 
                                         `}>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                
                                                <span className="text-lg font-semibold">{stat.group_name}</span>
                                            </div>

                                            <div className="text-end">

                                                <div className="text-sm opacity-75">{stat.session_count} sessions</div>
                                                <div className="font-medium">{formatTime(stat.total_duration)}</div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }
            </div>
            
            <div className='w-1/4 bg-gray-600 text-center rounded-md shadow-md'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-700'>
                    Recent Activity
                </div>
                {
                    isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <div className="p-6">

                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-2 flex justify-between items-center">
                                    
                                        <span className="text-md">Last Week</span>
                                        <span className="font-medium">{formatTime(weekTime)}</span>
                                    
                                </div>

                                <div className="p-2 flex justify-between items-center">
                                    
                                        <span className="text-md">Last Month</span>
                                        <span className="font-medium">{formatTime(monthTime)}</span>
                                    
                                </div>

                                <div className="p-2 flex justify-between items-center">
                                    
                                        <span className="text-md">Last Year</span>
                                        <span className="font-medium">{formatTime(yearTime)}</span>
                                    
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    </div>
  );
}