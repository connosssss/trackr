'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, deleteTimeSession } from "@/utils/timeSessionsDB";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Edit from "@/components/Edit";

interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  group: string | null;
}


export default function HistoryPage() {


    const { user, isLoading, signOut } = useAuth();

    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [sessions, setSessions] = useState<TimeSession[]>([]);


    const [editingSession, setEditingSession] = useState<TimeSession | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
          loadSessions();
        }
      }, [user]);

    const loadSessions = async () => {
      if (!user) return;
      
      setIsLoadingSessions(true);
      try {
        const data = await fetchTimeSessions(user);
        setSessions(data);
      } 
      
      catch (error) {
        console.error("Error loading sessions:", error);
      } 
      
      finally {
        setIsLoadingSessions(false);
      }
    };

    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };



    
    const handleDelete = async (sessionId: string) => {
      if (!user) return;
      
      try {
        await deleteTimeSession(sessionId);
        const updatedSessions = sessions.filter(session => session.id !== sessionId);
        setSessions(updatedSessions);
      } 
      catch (error) {
        console.error("Error deleting session:", error);
      }
    };

    const handleEdit = (session: TimeSession) => {
      setEditingSession(session);
      setIsEditing(true);
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

    const exportToSheet = async () => {
      if (!sessions || sessions.length === 0) {
        console.log("No sessions to export.");
        return;
      }
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('history');
  
      sheet.columns = [{ header: 'Date', key: 'date', width: 15 }, { header: 'Start Time', key: 'startTime', width: 15 },
        { header: 'End Time', key: 'endTime', width: 15 }, { header: 'Duration', key: 'duration', width: 15 },
        { header: 'Group Name', key: 'group', width: 20 },
      ];

      sessions.forEach(session => {
        sheet.addRow({date: session.start_time.toLocaleDateString(), startTime: session.start_time.toLocaleTimeString(),
          endTime: session.end_time ? session.end_time.toLocaleTimeString() : '-', duration: session.duration ? formatTime(session.duration) : '-',
          group: session.group || '-',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'history.xlsx');
    };

  return ( 
<div className=" bg-gray-800 min-h-screen h-full pb-20" >
<h1 className='text-xl font-semibold w-full py-5 text-center'> History</h1>
                {isLoadingSessions ? (

                  <div className="w-full h-full flex justify-center align-center">
                    <p>Loading sessions...</p>
                  </div>

                ) : sessions.length === 0 ? (

                  <p className="">No sessions recorded yet.</p>

                ) : (
                  <div>
                    
                    

                  <div className=" w-full mx-auto rounded-lg shadow-lg overflow-hidden ">
                    
                    <table className="w-full divide-y-2 divide-gray-200  text-md ">
                      <thead className="bg-gray-600 rounded-t-2xl ">
                        <tr>

                        <th scope="col" className="py-8 text-lg text-shadow-md ">Date</th>

                          <th scope="col" className="py-8 text-lg text-shadow-md ">Start Time</th>

                          <th scope="col" className="py-8 text-lg text-shadow-md ">End Time</th>

                          <th scope="col" className="py-8 text-lg text-shadow-md ">Duration</th>

                          <th scope="col" className="py-8 text-lg text-shadow-md ">Group Name</th>
                          
                          <th scope="col" className="py-8 text-lg text-shadow-md ">Edit</th>
                          
                          <th scope="col" className="py-8 text-lg text-shadow-md ">Delete</th>

                        </tr>
                      </thead>
                      <tbody className="bg-gray-700 divide-y divide-gray-600">

                        {

                          
                        sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-600 transition duration-300">
                            <td className="text-center py-5 text-gray-300">
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              {session.group}
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              <button 
                                onClick={() => handleEdit(session)}
                                className="bg-gray-500/70  hover:scale-115 hover:text-white py-1 px-6
                                rounded transition duration-300"
                              >
                                Edit
                              </button>
                            </td>
                            <td className="text-center py-5 text-gray-300">
                              <button 
                                onClick={() => handleDelete(session.id)}
                                className="bg-red-400/70 text-red-200 hover:text-red-50 hover:scale-115 py-1 px-6
                                rounded transition duration-300"
                              >
                                X
                              </button>
                            </td>
                          </tr>
                        ))
                        
                        }
                      </tbody>

                    </table>
                    
                    
                  </div>
                  <div className="w-full py-5 flex items-center justify-center">
                      <button onClick={exportToSheet}
                      className="px-5 py-3 rounded-md bg-gray-700 text-lg"> Export as a Spreadsheet</button>
                    </div>
                </div>)}

      {isEditing && editingSession && (
        <Edit
          editingSession={editingSession}
          onCancel={handleCancelEdit}
          onSave={handleSaveComplete}
          user={user}
        />
      )}
    </div> 
  );
}
