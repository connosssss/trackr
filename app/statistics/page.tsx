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

            <div className='w-[45%] bg-gray-600 text-center rounded-md shadow-md'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-700'>
                    Top Groups
                </div>
                {
                    isUpdatingStats ? (
                        <div className="h-full w-full flex items-center justify-center">
                            <p>Updating statistics...</p>
                        </div>
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
                                         hover:bg-gray-500 hover:scale-[1.02]`}>

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

        </div>
    </div>
  );
}