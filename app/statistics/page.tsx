"use client";

import { useState, useEffect  } from 'react'; 
import { useAuth } from "@/context/AuthContext";
import { fetchTimeSessions, fetchGroupList, updateGroupList, GroupStat } from "@/utils/timeSessionsDB";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, AreaChart, Area } from 'recharts';

import Navbar from "@/components/Navbar";

interface Session {
    id: string;
    user_id: string;
    start_time: Date;
    end_time: Date | null;
    duration: number | null;
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
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'alltime'>('week');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
    
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

    const preparePieChartData = () => {
        const groupMap = new Map<string, number>();
        
        sessions.forEach(session => {
            const groupName = session.group || 'No Group';
            const currentTime = groupMap.get(groupName) || 0;
            groupMap.set(groupName, currentTime + (session.duration || 0));
        });
        
        return Array.from(groupMap.entries()).map(([name, value]) => ({
                name,
                value,
                color: stringToColor(name)
            })).sort((a, b) => b.value - a.value); 
    };

    const prepareBarChartData = () => {

        const now = new Date();
        let startDate: Date;
        let dateLabels: string[] = [];
        
        switch (selectedPeriod) {

            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 6);
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    dateLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                }
                break;

            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    dateLabels.push(i.toString());
                }
                break;

            case '3months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 2);
                startDate.setDate(1);
                for (let i = 0; i < 3; i++) {
                    const date = new Date(now);
                    date.setMonth(now.getMonth() - (2 - i));
                    dateLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
                }
                break;

            case 'year':
                startDate = new Date(now);
                startDate.setMonth(0);
                startDate.setDate(1);
                for (let i = 0; i < 12; i++) {
                    const date = new Date(now.getFullYear(), i, 1);
                    dateLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
                }
                break;

            case 'alltime':
                if (sessions.length === 0) return [];

                const firstSession = sessions.reduce((earliest, session) => 
                    new Date(session.start_time) < new Date(earliest.start_time) ? session : earliest
                );

                const lastSession = sessions.reduce((latest, session) => 
                    new Date(session.start_time) > new Date(latest.start_time) ? session : latest
                );
                
                const firstDate = new Date(firstSession.start_time);
                const lastDate = new Date(lastSession.start_time);
                
                firstDate.setMonth(firstDate.getMonth());
                firstDate.setDate(1);
                lastDate.setMonth(lastDate.getMonth());
                lastDate.setDate(1);
                
                const current = new Date(firstDate);

                while (current <= lastDate) {
                    dateLabels.push(current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
                    current.setMonth(current.getMonth() + 1);
                }

                startDate = firstDate;
                break;
        }




        const dataMap = new Map<string, number>();
        dateLabels.forEach(label => dataMap.set(label, 0));

        sessions.forEach(session => {

            const sessionDate = new Date(session.start_time);
            
            if (session.duration) {
                let label: string = '';
                let shouldInclude = false;
                
                switch (selectedPeriod) {
                    case 'week':
                        if (sessionDate >= startDate) {
                            label = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
                            shouldInclude = true;
                        }
                        break;
                    case 'month':
                        if (sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear()) {
                            label = sessionDate.getDate().toString();
                            shouldInclude = true;
                        }
                        break;
                    case '3months':
                        if (sessionDate >= startDate) {
                            label = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                            shouldInclude = true;
                        }
                        break;
                    case 'year':
                        if (sessionDate.getFullYear() === now.getFullYear()) {
                            label = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                            shouldInclude = true;
                        }
                        break;
                    case 'alltime':
                        if (sessionDate >= startDate) {
                            label = sessionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                            shouldInclude = true;
                        }
                        break;
                }
                
                if (shouldInclude && label && dataMap.has(label)) {
                    const currentTime = dataMap.get(label) || 0;
                    dataMap.set(label, currentTime + session.duration);
                }
            }
        });

        return dateLabels.map(label => ({
            name: label,
            hours: Math.round((dataMap.get(label) || 0) / 3600 * 100) / 100
        }));
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

    const pieChartData = preparePieChartData();
    const barChartData = prepareBarChartData();

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
                ) : pieChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-80">
                        <p className="text-lg opacity-75">No data available</p>
                    </div>
                ) : (
                    <div className="h-full w-full">
                        <div className='text-center text-2xl font-semibold'> Group Breakdown </div>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>

                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        stroke="#0"
                                    >

                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}

                                    </Pie>

                                    <Tooltip 
                                        formatter={(value: number, name: string) => [
                                            <span style={{ color: '#d1d5db' }}>{name}: {formatTime(value)}</span>
                                        ]}
                                        
                                        labelFormatter={() => ""}
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                       
                        
                    </div>
                )}
            </div>

            <div className='w-1/2 bg-gray-800 rounded-md shadow-lg shadow-indigo-900/20 p-6'>
                <div className="flex justify-between items-center mb-4">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | '3months' | 'year' | 'alltime')}
                        className="bg-gray-800 text-white rounded px-3 py-1 border border-gray-500 
                        focus:outline-none focus:border-gray-400"
                    >

                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                        <option value="alltime">All Time</option>

                    </select>
                    
                    <div className='text-xl font-semibold'> Quick Graph</div>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'area')}
                        className="bg-gray-800 text-white rounded px-3 py-1 border border-gray-500 
                        focus:outline-none focus:border-gray-400"
                        >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="area">Area Chart</option>
                    </select>
                </div>

                {isLoading ? (

                    <div className="flex items-center justify-center h-80">
                        Loading...
                    </div>

                ) : barChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-80">

                        No data available
                    </div>

                ) : (

                    <div className="h-80 w-full">

                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        interval={0}
                                        tick={{ fontSize: 10 }}
                                        
                                    />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => [`${value} hours`, 'Hours Worked']}
                                        labelStyle={{ color: '#d1d5db' }}
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />

                                    <Bar 
                                        dataKey="hours" 
                                        fill="#563ead"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            ) : chartType === 'line' ? (

                                <LineChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        interval={0}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => [`${value} hours`, 'Hours Worked']}
                                        labelStyle={{ color: '#d1d5db' }}
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="hours" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                    />
                                </LineChart>

                            ) : (

                                <AreaChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        interval={0}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af"
                                        fontSize={12}
                                    />
                                    <Tooltip 
                                        formatter={(value: number) => [`${value} hours`, 'Hours Worked']}
                                        labelStyle={{ color: '#d1d5db' }}
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                        }}
                                    />

                                    <Area 
                                        type="monotone" 
                                        dataKey="hours" 
                                        stroke="#8b5cf6" 
                                        fill="#8b5cf6"
                                        fillOpacity={0.6}
                                    />
                                </AreaChart>


                            )}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

        </div>
    </div>
    </>
  );
}