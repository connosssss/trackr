'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, deleteTimeSession, createTimeSession } from "@/utils/timeSessionsDB";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Edit from "@/components/Edit";
import Navbar from "@/components/Navbar";


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
    const [optionsOpen, setOptionsOpen] = useState(false);


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

    const handleDeleteFromEdit = async () => {
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

    const newSession = async () => {
      if(!user) return;

      let session = await createTimeSession({
        user_id: user.id,
        start_time: new Date(),
        end_time: null,
        duration: null,
        group: null
      })
      
      
      handleEdit(session);


    }




    //might make just 1 big handle excel function instead of everything seperate
    const importFromSheet = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) return;

      const file = event.target.files?.[0];
      if (!file) return;
  
      const workbook = new ExcelJS.Workbook();
      const reader = new FileReader();
  
      reader.onload = async (e) => {

        if (e.target?.result) {

          try {



            const buffer = e.target.result as ArrayBuffer;
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
              console.error("file not found");
              return;
            }
  
            const preAddSessions: Omit<TimeSession, 'id'>[] = [];
  
            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {

              if (rowNumber === 1) return; 
  
              const dateCell = row.getCell(1).value;
              const startTimeCell = row.getCell(2).value;
              const endTimeCell = row.getCell(3).value;
              const durationCell = row.getCell(4).value;
              const groupCell = row.getCell(5).value;
  
              //formatting everything
              const date = dateCell?.toString() || '';
              const startTime = startTimeCell?.toString() || '';
              const endTime = endTimeCell?.toString() || '-';
              const duration = durationCell?.toString() || '-';
              const group = groupCell?.toString() || '-';
  
              if (!date || !startTime || !endTime) {
                alert(`Skipping row ${rowNumber} due to missing time or date`)
                return;
              }
  
              const startDateTime = new Date(`${date} ${startTime}`);
              const endDateTime = endTime !== '-' ? new Date(`${date} ${endTime}`) : null;
              
              let secondsLength: number | null = null;
              if (duration && duration !== '-') {

                const parts = duration.split(':').map(Number);

                if (parts.length === 3) {
                  secondsLength = parts[0] * 3600 + parts[1] * 60 + parts[2];
                }
                
              }
  
              preAddSessions.push({
                user_id: user.id,
                start_time: startDateTime,
                end_time: endDateTime,
                duration: secondsLength,
                group: group === '-' ? null : group,
              });
            });
  
            
            for (const session of preAddSessions) {
              await createTimeSession(session);
            }
            
            await loadSessions();
            //might start using alerts instead of console.error
            alert(`Successfully imported ${preAddSessions.length} sessions`);
          } 
          
          catch (error) {

          
            alert("Error importing sessions");
          }
        }

      };
  
      reader.readAsArrayBuffer(file);
      
      

      event.target.value = '';
    };

  return ( 
<div className=" bg-[#141318] min-h-screen h-full pb-20 " >
<Navbar />

                {isLoadingSessions ? (

                  <div className="w-screen h-screen flex justify-center items-center flex-col gap-20">
                    <p className="text-4xl font-bold">Loading sessions...</p>
                    <div className=" animate-spin w-16 h-16 rounded-full border-8 border-white border-b-transparent"/>
                  </div>

                ) : sessions.length === 0 ? (

                  <p className="w-full text-center pt-7 text-xl font-semibold">No sessions recorded yet</p>

                ) : (
                  <div className="bg-[#141318] h-full">
                    
                    
                    
                  <div className="w-10/12 mx-auto flex items-center justify-start -translate-x-8 gap-5 ">
                      <button onClick={() => {setOptionsOpen(!optionsOpen)}}
                      className="px-6 py-2 rounded-md bg-[#0c0b10] hover:bg-[#2A292E] text-md mt-5"> Options </button>
                      {/*width changing isnt working rn os got to do this for now */}
                        <div className={`flex flex-row items-center gap-5 transform origin-left transition-all duration-300 ease-in-out ${optionsOpen ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}><button onClick={exportToSheet}
                      className={`px-6 py-2 rounded-md bg-[#0c0b10] hover:bg-[#2A292E] text-md whitespace-nowrap mt-5`}> Export As .xlsx (SpreadSheet)</button>
                      <button onClick={newSession}
                      className={`px-6 py-2 rounded-md bg-[#0c0b10] hover:bg-[#2A292E] text-md whitespace-nowrap mt-5`}> Create New Session</button>
                      
                      <label className="px-6 py-2 rounded-md bg-[#0c0b10] hover:bg-[#2A292E] text-md whitespace-nowrap mt-5 cursor-pointer">
                            Import From .xlsx (SpreadSheet)
                      <input type="file" accept=".xlsx" onChange={importFromSheet} className="hidden"/>
                      </label>
                      </div>
                    </div>
                  <div className=" w-10/12 mx-auto overflow-hidden -translate-x-8 "> 
                    
                    <table className="w-full divide-y-2 divide-gray-200  text-md ">
                      <thead className=" rounded-t-2xl ">
                        <tr>

                        <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Date</th>

                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Start Time</th>

                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">End Time</th>

                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Duration</th>

                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Group Name</th>
                          
                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Edit</th>
                          
                          <th scope="col" className="pt-7 pb-3 text-lg text-shadow-md ">Delete</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20">

                        {

                          
                        sessions.map((session) => (
                          <tr key={session.id} className="">
                            <td className="text-center py-2 text-gray-300 text-sm">
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              {session.group}
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              <button 
                                onClick={() => handleEdit(session)}
                                className="bg-[#0c0b10] hover:bg-[#2A292E] py-1 px-6
                                rounded transition duration-300"
                              >
                                Edit
                              </button>
                            </td>
                            <td className="text-center py-2 text-gray-300 text-sm">
                              <button 
                                onClick={() => handleDelete(session.id)}
                                className=" bg-[#0c0b10] hover:bg-[#2A292E] py-1 px-6
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
                  
                </div>)}

      {isEditing && editingSession && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-20"
        onClick={handleCancelEdit}>
        <Edit
          editingSession={editingSession}
          onCancel={handleCancelEdit}
          onSave={handleSaveComplete}
          onDelete={handleDeleteFromEdit}
          user={user}
        />
        </div>
      )}
    </div> 
  );
}
