'use client';

import Navbar from "@/components/Navbar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, AreaChart, Area, Tooltip } from 'recharts';
import {useState, useEffect} from "react"; 
import { fetchTimeSessions, TimeSession} from "@/utils/timeSessionsDB";
import { useAuth } from "@/context/AuthContext";



export default function LoginPage() {

    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'alltime'>('week');
    const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
    const [sessions, setSessions] = useState<TimeSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();



    
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


    const prepareChartData = () => {
        if (sessions.length === 0) return [];

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

        // i forgot this part 

        const dataMap = new Map<string, number>();
        dateLabels.forEach(label => dataMap.set(label, 0));

        
        sessions.forEach(session => {
            if (!session.duration || session.duration <= 0) return;

            const sessionDate = new Date(session.start_time);
            let key: string;

            switch (selectedPeriod) {
                case 'week':
                    if (sessionDate >= startDate) {
                        key = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
                        if (dataMap.has(key)) {
                            dataMap.set(key, dataMap.get(key)! + (session.duration / 3600)); // Convert to hours
                        }
                    }
                    break;

                case 'month':
                    if (sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear()) {
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
    <div className="flex  bg-gray-900 w-full items-center justify-center h-screen  ">
        <Navbar/>

            <div className='w-[90%] h-[50%] bg-gray-800 rounded-md shadow-lg shadow-indigo-900/20 p-6'>
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
  );
}