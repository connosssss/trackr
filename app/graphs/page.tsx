'use client';

import Navbar from "@/components/Navbar";
import BarChart, { stringToColor } from "@/components/BarChart";
import { useTheme } from "@/context/ThemeContext";

import { useState, useEffect } from "react";
import { fetchTimeSessions, TimeSession } from "@/utils/timeSessionsDB";
import { useAuth } from "@/context/AuthContext";



export default function Graphs() {

    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'alltime'>('week');
    const [sessions, setSessions] = useState<TimeSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showGroups, setShowGroups] = useState(true);
    // default to dark until user preference loads
    const { theme } = useTheme();

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

            }

            catch (error) {
                console.error('Error loading sessions:', error);
            }

            finally {
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

        const dataMap = new Map<string, Map<string, number>>();
        dateLabels.forEach(label => dataMap.set(label, new Map()));


        sessions.forEach(session => {
            if (!session.duration || session.duration <= 0) return;

            const sessionDate = new Date(session.start_time);
            let key: string | undefined;

            switch (selectedPeriod) {
                case 'week':
                    if (sessionDate >= startDate && sessionDate <= endDate) {
                        key = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });

                    }
                    break;

                case 'month':
                    if (sessionDate >= startDate && sessionDate <= endDate) {
                        key = sessionDate.getDate().toString();

                    }
                    break;

                case '3months':
                    if (sessionDate >= startDate) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short' });

                    }
                    break;

                case 'year':
                    if (sessionDate.getFullYear() === now.getFullYear()) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short' });

                    }
                    break;

                case 'alltime':
                    if (sessionDate >= startDate) {
                        key = sessionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

                    }
                    break;
            }

            if (key && dataMap.has(key)) {
                const groupMap = dataMap.get(key)!;
                const groupName = session.group || 'Uncategorized';
                const currentDuration = groupMap.get(groupName) || 0;
                groupMap.set(groupName, currentDuration + (session.duration / 3600));
            }
        });

        return dateLabels.map(label => {
            const groupMap = dataMap.get(label)!;
            let segments = Array.from(groupMap.entries()).map(([groupName, duration]) => ({
                value: duration,
                color: groupName === 'Uncategorized' ? '#65656E' : stringToColor(groupName),
                label: groupName
            }));

            const total = segments.reduce((sum, seg) => sum + seg.value, 0);

            if (!showGroups) {
                segments = [{
                    value: total,
                    color: '#65656E',
                    label: 'Total'
                }];
            }

            else {

                segments.sort((a, b) => a.label.localeCompare(b.label));
            }

            return {
                label,
                total,
                segments
            };
        });
    };


    const barChartData = prepareChartData();


    return (
        <div className={`${theme == "default" ? "bg-[#141318] text-white" : "bg-[#f2f6fc] text-black"} w-full`}>
            <div className="flex flex-col  w-[95%] items-center  min-h-screen   ">
                <Navbar />


                <div className="flex mb-4 flex-row w-full justify-between items-center">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | '3months' | 'year' | 'alltime')}
                        className={`rounded px-9 py-3 border text-md ml-5 focus:outline-none focus:border-gray-400 ${theme == "default" ? 'bg-[#0c0b10] text-white border-gray-500' : 'bg-[#f2f6fc] text-black border-gray-300'}`}
                    >

                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                        <option value="alltime">All Time</option>

                    </select>

                    {
                        (selectedPeriod === 'week' || selectedPeriod === 'month') && (

                            <div className="flex justify-center gap-3 items-center py-3">
                                <button
                                    onClick={() => selectedPeriod === 'week' ? changeWeek('before') : changeMonth('before')}
                                    className={`${theme == "default" ? 'text-white bg-[#0c0b10] hover:bg-gray-500' : 'text-black bg-[#aab3bf] hover:bg-[#8a94a1]'} px-3 py-1 rounded-md transition-all duration-300`}
                                >
                                    ←
                                </button>

                                <div className={`${theme == "default" ? 'text-white' : 'text-black'} text-lg font-medium  w-auto`}>
                                    {selectedPeriod === 'week' ? formatWeekRange() : formatMonthRange()}
                                </div>

                                <button
                                    onClick={() => selectedPeriod === 'week' ? changeWeek('later') : changeMonth('later')}
                                    className={`${theme == "default" ? 'text-white bg-[#0c0b10] hover:bg-gray-500' : 'text-black bg-[#aab3bf] hover:bg-[#8a94a1]'} px-3 py-1 rounded-md transition-all duration-300`}
                                >
                                    →
                                </button>


                            </div>

                        )}

                    <div className="flex items-center gap-2 min-w-40 justify-center mr-5">
                        <input
                            type="checkbox"
                            id="showGroupsCheckbox"
                            checked={showGroups}
                            onChange={(e) => setShowGroups(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="showGroupsCheckbox" className="text-md font-medium cursor-pointer">Show Groups</label>
                    </div>

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

                    <div className="h-[42rem] w-full p-4">
                        <BarChart
                            data={barChartData}
                            height={600}
                        />
                    </div>
                )}
            </div></div>
    );
}