"use client";

import { useState, useEffect  } from 'react'; 
import { useAuth } from "@/context/AuthContext";
import { fetchTimeSessions, fetchGroupList, updateGroupList, GroupStat } from "@/utils/timeSessionsDB";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, AreaChart, Area, Tooltip } from 'recharts';



import Navbar from "@/components/Navbar";

interface Session {
    id: string;
    user_id: string;
    start_time: Date;
    end_time: Date | null;
    duration: number | null;
    group: string | null;
  }


export default function stats() {

    const { user } = useAuth();

    const [totalTime, setTotalTime] = useState<number>(0);
    const [groupList, setgroupList] = useState<GroupStat[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingStats, setIsUpdatingStats] = useState(false);
    const [weekTime, setWeekTime] = useState<number>(0);
    const [monthTime, setMonthTime] = useState<number>(0);
    const [yearTime, setYearTime] = useState<number>(0);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'alltime'>('week');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
    const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
     const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hourLabels = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
    
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

    const stringToColor = (str: string) => {
        let hash = 1;

        for (let i = 0; i < str.length; i++) {

            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash) % 360;
        const saturation = 65 + (Math.abs(hash) % 35);
        const lightness = 45 + (Math.abs(hash) % 20);
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const createActivityHeatmap = () => {
        // hopefully works right
        const heatmapArray: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
        
        sessions.forEach(session => {
            if (!session.start_time || !session.duration) return;
            
            const startTime = new Date(session.start_time);
            const endTime = session.end_time ? new Date(session.end_time) : new Date(startTime.getTime() + (session.duration * 1000));
           
            const dayOfWeek = startTime.getDay();
            let time = new Date(startTime);
            const sessionEndTime = new Date(endTime);
    

            while (time < sessionEndTime) {
                const hour = time.getHours();
                const nextHour = new Date(time);
                nextHour.setHours(hour + 1, 0, 0, 0);
                
                const periodEnd = nextHour > sessionEndTime ? sessionEndTime : nextHour;
                const timeInThisHour = (periodEnd.getTime() - time.getTime()) / 1000;
                
                heatmapArray[dayOfWeek][hour] += timeInThisHour;
                
                time = nextHour;
             
            }
        });
        
        const maxValue = Math.max(...heatmapArray.flat());
        return heatmapArray.map(day => 
            day.map(hour => maxValue > 0 ? hour / maxValue : 0)
        );
    };

    const getColorIntensity = (intensity: number) => {
        if (intensity === 0) return 'rgba(34, 197, 94, 0.1)'; 

        const opacity = Math.max(0.25, intensity); 
        return `rgba(34, 197, 94, ${opacity})`;
    };

    const createPieSlices = () => {


        const groupMap = new Map<string, number>();
        
        sessions.forEach(session => {
            const groupName = session.group || 'No Group';
            const time = groupMap.get(groupName) || 0;
            groupMap.set(groupName, time + (session.duration || 0));
        });
        

        const data = Array.from(groupMap.entries()).map(([name, value]) => ({
                name,
                value,
                color: stringToColor(name)
            })).sort((a, b) => b.value - a.value);


        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulativeAngle = 0;
        const radius = 130;
        const centerX = 150;
        const centerY = 150;


        const degToRad = (deg: number) => (deg - 90) * Math.PI / 180;

        return data.map((item, index) => {
            
            const percentage = Math.round((item.value / total) * 1000) / 10;
            const angle = (item.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            
            const startRad = degToRad(startAngle);
            const endRad = degToRad(endAngle);
            
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            cumulativeAngle += angle;

            return {
                pathData,
                color: item.color,
                name: item.name,
                value: item.value,
                percentage,
                index
            };
        });
    };


      const loadSessions = async () => {
        setIsLoading(true);
        if (!user) return;

        try {
            const temp = await fetchTimeSessions(user);
            setSessions(temp);
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
    const pieSlices = createPieSlices();
    const heatmapArray = createActivityHeatmap();

  return (<><Navbar/>
    <div className="min-h-screen w-full bg-gray-900 pb-16 pt-10">
      
        

        
        <div className="w-5/6 mx-auto min-h-72 rounded-md  
        flex flex-row gap-8">
            <div className='w-1/4 bg-gray-800 text-center rounded-md shadow-lg shadow-indigo-900/20'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-900'>
                    Total Time
                </div>
                {
                    isLoading ? (
                        <div>Loading...</div>
                    ) : (
                  <div className="h-full w-full flex flex-col gap-12 mt-14">

                  <div className='text-5xl font-semibold text-shadow-2xs hover:scale-120 transition-all duration-300'>
                      {formatTime(totalTime)} 
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

            <div className='w-1/2 bg-gray-800 text-center rounded-md shadow-lg shadow-indigo-900/20'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-900'>
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
                                         className={`p-4 rounded-lg transition-all duration-300 bg-gray-900/60 hover:shadow-lg
                                         ${index == 0 ? 'text-amber-400 hover:shadow-amber-400/30 ' : index == 1 ? 'text-slate-300 hover:shadow-slate-300/30' : 'text-orange-600 hover:shadow-orange-600/30'}`}>

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
            
            <div className='w-1/4 bg-gray-800 text-center rounded-md shadow-lg shadow-indigo-900/20'>
                <div className='text-2xl font-semibold mt-5 border-b-2 border-gray-900'>
                    Recent Activity
                </div>
                {
                    isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <div className="p-6">

                            
                            <div className="grid grid-cols-1 gap-12 text-xl font-semibold mt-4 ">
                                <div className="p-2 flex justify-between items-center text-green-300/85 hover:text-green-300 hover:scale-110
                                transform transition-all duration-300">
                                    
                                        <span >Last Week</span>
                                        <span >{formatTime(weekTime)}</span>
                                    
                                </div>

                                <div className="p-2 flex justify-between items-center text-[#68f2d9]/80 hover:text-[#68f2d9] hover:scale-110
                                transform transition-all duration-300">
                                    
                                        <span >Last Month</span>
                                        <span >{formatTime(monthTime)}</span>
                                    
                                </div>

                                <div className="p-2 flex justify-between items-center text-sky-300/80 hover:text-sky-300 hover:scale-110
                                transform transition-all duration-300">
                                    
                                        <span >Last Year</span>
                                        <span >{formatTime(yearTime)}</span>
                                    
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>


            
        </div>
        <div className="w-5/6 mx-auto  min-h-96 rounded-md  mt-12 
        flex flex-row gap-12">

            <div className='w-1/2 bg-gray-800 rounded-md shadow-lg shadow-indigo-900/20 p-6'>

                {isLoading ? (
                    <div className="flex items-center justify-center h-80">
                        Loading...
                    </div>
                ) : pieSlices.length === 0 ? (
                    <div className="flex items-center justify-center h-80">
                        <p className="text-lg opacity-75">No data available</p>
                    </div>
                ) : (
                    <div className="h-full w-full">

                        <div className='text-center text-2xl font-semibold'> Group Breakdown </div>
                        <div className="flex items-center justify-center h-80">

                            <div className="relative">

                                <svg width="300" height="300" className="transform -rotate-90">

                                    {pieSlices.map((slice, index) => (
                                        <path
                                            key={index}
                                            d={slice.pathData}
                                            fill={slice.color}
                                            stroke="#1f2937"
                                            strokeWidth="2"
                                            className={`transition-all duration-200 cursor-pointer ${
                                                hoveredSlice === index ? 'opacity-80' : 'opacity-100'}`}

                                            onMouseEnter={() => setHoveredSlice(index)}
                                            onMouseLeave={() => setHoveredSlice(null)}
                                        />
                                    ))}

                                </svg>

                                {hoveredSlice !== null && pieSlices[hoveredSlice] && (
                                    <div className="absolute bg-gray-700/60 text-white px-3 py-2 rounded-lg text-sm pointer-events-none shadow-lg
                                    top-1/3 transform -translate-x-24">
                                                        
                                        <div className="font-semibold">{pieSlices[hoveredSlice].name}</div>
                                        <div>{formatTime(pieSlices[hoveredSlice].value)}</div>
                                        <div className="text-xs opacity-75">{pieSlices[hoveredSlice].percentage}%</div>
                                    </div>
                                )}
                                
                            </div>
                        </div>
                        
                    </div>
                )}
            </div>

            <div className='w-1/2 bg-gray-800 rounded-md shadow-lg shadow-indigo-900/20 p-6 flex flex-col items-center justify-center gap-6'>
            <div className='flex flex-row w-full text-center items-center '>
                <div className=" absolute pointer-events-none z-10  rounded-md   text-center font-semibold bg-gray-700/20  h-20 pt-1 w-[11%]">
                                {hoveredCell && (<div className='justify-center items-center'>
                                <div>

                                    {dayLabels[hoveredCell.row]} at {hourLabels[hoveredCell.col]}:00
                                </div>

                                <div>
                                    {formatTime(Math.round(heatmapArray[hoveredCell.row][hoveredCell.col] * Math.max(...heatmapArray.flat()) * 3600))}
                                </div>

                                <div>
                                    {(heatmapArray[hoveredCell.row][hoveredCell.col] * 100).toFixed(1)}%
                                </div></div>)}

                            </div>
                            <h1 className='font-semibold text-2xl mb-4 w-full mt-2'>Activity by the Hour</h1>
                
                </div>
                

                {
                isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        Loading...
                    </div>) : (

                    <div className='w-full h-full flex flex-col items-center'>

                        
                        <div className='grid grid-cols-24 gap-1 w-[92%] ml-10  mb-2 text-xs text-gray-400'>
                            {hourLabels.map((hour, index) => (
                                <div key={hour} className={`text-center ${index % 3 == 0 ? 'opacity-100' : 'opacity-0'}`}>
                                    {hour}
                                </div>
                            ))}
                        </div>
                        
                       
                        <div className='flex flex-col gap-1 w-full'>
                            {heatmapArray.map((dayData, dayIndex) => (
                                <div key={dayIndex} className='flex gap-1 items-center'>
                                 
                                    <div className='w-8 text-xs text-gray-400 text-right mr-2'>

                                        {dayLabels[dayIndex] }
                                        
                                    </div>
                                    
                              
                                    <div className='grid grid-cols-24 gap-1 flex-1'>
                                        {dayData.map((intensity, hourIndex) => (
                                            <div
                                                key={`${dayIndex}-${hourIndex}`}
                                                className="aspect-square relative rounded-sm"
                                                style={{backgroundColor: getColorIntensity(intensity) }}
                                                onMouseEnter={() => setHoveredCell({row: dayIndex, col: hourIndex})}
                                                onMouseLeave={() => setHoveredCell(null)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        
                            
                        
                        
                        
                        <div className='flex items-center gap-2 mt-4 text-xs text-gray-400'>
                            <div>Less</div>

                            <div className='flex gap-1'>
                                
                                {Array.from({length: 5}, (_, i) => (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-sm"
                                        style={{ backgroundColor: `rgba(34, 197, 94, ${0.2 + (i * 0.2)})` }}
                                    />
                                ))}
                            </div>

                            <div>More</div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    </div>
    </>
  );
}