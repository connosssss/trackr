'use client';

import Navbar from "@/components/Navbar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, AreaChart, Area, Tooltip } from 'recharts';
import {useState, useEffect} from "react"; 
import { fetchTimeSessions, TimeSession} from "@/utils/timeSessionsDB";
import { useAuth } from "@/context/AuthContext";


//git url testing
export default function LoginPage() {

    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'alltime'>('week');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
    const [sessions, setSessions] = useState<TimeSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();


    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        return monday;
    });

    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });



    
    useEffect(() => {
        const loadSessions = async () => {
            if (!user) return;

            setIsLoading(true);
            try {
                const fetchedSessions = await fetchTimeSessions(user);
                setSessions(fetchedSessions);
            } catch (error) {
                console.error('Error loading sessions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSessions();
    }, [user]);


    //week from main
    //need years, month working
    const changeWeek = (direction: 'before' | 'later') => {
        const newWeekStart = new Date(currentWeekStart);
        newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'later' ? 7 : -7));
        setCurrentWeekStart(newWeekStart);
    };

    const changeMonth = (direction: 'before' | 'later') => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(currentMonth.getMonth() + (direction === 'later' ? 1 : -1));
        setCurrentMonth(newMonth);
    };



    const formatWeekRange = () => {

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
            return `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()}-${weekEnd.getDate()}, ${currentWeekStart.getFullYear()}`;
        } else {
            return `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${currentWeekStart.getFullYear()}`;
        }
    };

    const formatMonthRange = () => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[currentMonth.getMonth()]}   ${currentMonth.getFullYear()}`;
    };

    const prepareChartData = () => {
        if (sessions.length === 0) return [];

        const now = new Date();
        let startDate: Date;
        let endDate: Date;
        let dateLabels: string[] = [];

        switch (selectedPeriod) {

            case 'week':
                startDate = new Date(currentWeekStart);
                endDate = new Date(currentWeekStart);
                endDate.setDate(currentWeekStart.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                
                for (let i = 0; i < 7; i++) {
                    const date = new Date(currentWeekStart);
                    date.setDate(currentWeekStart.getDate() + i);
                    dateLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                }
                break;

            case 'month':
                startDate = new Date(currentMonth);
                endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                
                const daysInMonth = endDate.getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    dateLabels.push(i.toString());
                }
                break;

            case '3months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 2);
                startDate.setDate(1);
                endDate = new Date(now);
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
                endDate = new Date(now);
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
                endDate = new Date(lastDate);
                break;
        }

        // i forgot this part 

        const dataMap = new Map<string, number>();
        dateLabels.forEach(label => dataMap.set(label, 0));

        
        sessions.forEach(session => {
            if (!session.duration || session.duration <= 0) return;

            const sessionDate = new Date(session.start_time);
            let key: string;

            switch (selectedPeriod) {
                case 'week':
                    if (sessionDate >= startDate && sessionDate <= endDate) {
                        key = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600));
                        }
                    }
                    break;

                case 'month':
                    if (sessionDate >= startDate && sessionDate <= endDate) {
                        key = sessionDate.getDate().toString();
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600));
                        }
                    }
                    break;

                case '3months':
                    if (sessionDate >= startDate) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600));
                        }
                    }
                    break;

                case 'year':
                    if (sessionDate.getFullYear() === now.getFullYear()) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600));
                        }
                    }
                    break;

                case 'alltime':
                    if (sessionDate >= startDate) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600));
                        }
                    }
                    break;
            }
        });

        return dateLabels.map(label => ({
            name: label,
            hours: Math.round((dataMap.get(label) || 0) * 100) / 100 

        }));
    };


    const barChartData = prepareChartData();


  return (
    <div className="bg-gray-900 w-full">
    <div className="flex flex-col bg-gray-900 w-[95%] items-center  min-h-screen   ">
        <Navbar/>

            
                <div className="flex  mb-4 flex-row w-full justify-between">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | '3months' | 'year' | 'alltime')}
                        className="bg-gray-800 text-white rounded px-9 py-3 border border-gray-500 text-md mt-5 ml-5
                        focus:outline-none focus:border-gray-400"
                    >

                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                        <option value="alltime">All Time</option>

                    </select>
                    
                    <div className='text-3xl font-semibold mt-5'> Time Graph</div>
                    <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value as 'bar' | 'line' | 'area')}
                        className="bg-gray-800 text-white rounded px-9 py-3 border border-gray-500 text-md mt-5 
                        focus:outline-none focus:border-gray-400"
                        >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="area">Area Chart</option>
                    </select>
                </div>

                
                {
                (selectedPeriod === 'week' || selectedPeriod === 'month') && (

                    <div className="flex justify-center gap-3 items-center py-3 w-full  mb-4 ml-9">
                        <button 
                            onClick={() => selectedPeriod === 'week' ? changeWeek('before') : changeMonth('before')}
                            className="text-white bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-500 transition-all duration-300"
                        >
                            ← 
                        </button>

                        <div className="text-white text-lg font-medium  w-auto">
                            {selectedPeriod === 'week' ? formatWeekRange() : formatMonthRange()}
                        </div>
                        
                        <button 
                            onClick={() => selectedPeriod === 'week' ? changeWeek('later') : changeMonth('later')}
                            className="text-white bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-500 transition-all duration-300"
                        >
                            →
                        </button>

                        
                    </div>

                )}

                {isLoading ? (

                    <div className="flex items-center justify-center h-80">
                        Loading...
                    </div>

                ) : barChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-80">

                        No data available
                    </div>

                ) : (

                    <div className="h-[42rem] w-full">

                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
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
  </div></div>
  );
}