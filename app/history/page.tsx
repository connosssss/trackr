'use client';

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { fetchTimeSessions, deleteTimeSession, createTimeSession, TimeSession } from "@/utils/timeSessionsDB";
//import {fetchUserTheme } from "@/utils/userSettings"
import { useTheme } from "@/context/ThemeContext";

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Edit from "@/components/Edit";
import Navbar from "@/components/Navbar";


/*
Darkest
 bg-[#0B0A0E] -> bg-[#0c0b10]
bg-[#141318]  background
bg-[#1B1A1F] 
bg-[#2A292E]
#4b4b51ff
Lightest

calendar part
bg-[#2A292E]/80 hover:hover:bg-[#313136]/80


LIGHT THEME:
bit bit darker  #8a94a1
a bit darker: bg-[#aab3bf]
base : bg-[#f2f6fc]

white #fcfafa
*/


export default function HistoryPage() {


    const { user, isLoading, signOut } = useAuth();

    const [isLoadingData, setisLoadingData] = useState(false);
    const [sessions, setSessions] = useState<TimeSession[]>([]);


    const [editingSession, setEditingSession] = useState<TimeSession | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);

    const {theme} = useTheme();


    useEffect(() => {
        if (user) {
          loadData();
        }
      }, [user]);

    const loadData = async () => {
            if (!user) return;
            setisLoadingData(true);
            try {
              const data = await fetchTimeSessions(user);
              setSessions(data);
              
             
            } 
            
            catch (error) {
              console.error("Error loading sessions or Settings:", error);
            } 
            finally {
              setisLoadingData(false);
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

    const handleClear = async () =>{
      if(!user) return

      if(window.confirm("Are you sure you want to clear the data. Unless already exported, the is no way to recover it.")){
        
        try{
          for(let session of sessions){
            handleDelete(session.id);
          } 
          window.location.reload();
        }

        catch(error){
          alert("error in clearing sessions")
        }

    }
  }

    const handleEdit = (session: TimeSession) => {
      setEditingSession(session);
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditingSession(null);
    };

    const handleSaveComplete = async (updatedSession: TimeSession) => {
      await loadData();
      setIsEditing(false);
      setEditingSession(null);
    };

    const handleDeleteFromEdit = async () => {
      await loadData();
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
        group: null,
        be_in_heatmap: true
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
  
            const preAddSessions: Array<{
              user_id: string;
              start_time: Date;
              end_time: Date | null;
              duration: number | null;
              group: string | null;
            }> = [];
  
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
                be_in_heatmap: true
              });
            });
  
            
            for (const session of preAddSessions) {
              await createTimeSession(session);
            }
            
            await loadData();
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
<div className={`${theme == "default" ? "bg-[#141318]" : "bg-[#f2f6fc] text-black"} min-h-screen h-full pb-20`} >
<Navbar />

                {isLoadingData ? (

                  <div className="w-screen h-screen flex justify-center items-center flex-col gap-20">
                    <p className="text-4xl font-bold">Loading sessions...</p>
                    <div className=" animate-spin w-16 h-16 rounded-full border-8 border-white border-b-transparent"/>
                  </div>

                ) : sessions.length === 0 ? (

                  <p className="w-full text-center pt-7 text-xl font-semibold">No sessions recorded yet</p>

                ) : (
                  <div className="h-full">
                    
                    
                    
                  <div className="w-10/12 mx-auto flex items-center justify-start -translate-x-8 gap-5 ">
                      <button onClick={() => {setOptionsOpen(!optionsOpen)}}
                      className={`px-6 py-2 rounded-md ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf] hover:bg-[#8a94a1]"} text-md mt-5`}> Options </button>
                      {/*width changing isnt working rn os got to do this for now */}
                        <div className={`flex flex-row items-center gap-5 overflow-hidden transition-all duration-700 ease-in-out ${optionsOpen ? 'max-w-[80rem] opacity-100' : 'max-w-0 opacity-0'}`}><button onClick={exportToSheet}
                      className={`px-6 py-2 rounded-md ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf] hover:bg-[#8a94a1]"} text-md whitespace-nowrap mt-5 
                      transition-all duration-300`}> Export As .xlsx (SpreadSheet)</button>
                      
                      <label className={`px-6 py-2 rounded-md ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf] hover:bg-[#8a94a1]"} text-md whitespace-nowrap mt-5 cursor-pointer 
                      transition-all duration-300`}>
                            Import From .xlsx (SpreadSheet)
                      <input type="file" accept=".xlsx" onChange={importFromSheet} className="hidden"/>
                      </label>
                      
                      <button onClick={newSession}
                      className={`px-6 py-2 rounded-md ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf] hover:bg-[#8a94a1]"} text-md whitespace-nowrap mt-5 
                      transition-all duration-300`}> Create New Session</button>

                      <button onClick={handleClear}
                      className={`px-6 py-2 rounded-md ${theme == "default" ? " hover:bg-[#ba4747]" : "hover:bg-[#792d2d] bg-[#ba4747]"} text-md whitespace-nowrap mt-5 
                      transition-all duration-300`}> Clear all Session History</button>
                      
                      
                      </div>
                    </div>
                  <div className=" w-10/12 mx-auto overflow-hidden -translate-x-8 "> 
                    
                    <table className={`w-full divide-y-2 ${theme == "default" ? "divide-gray-200" : "divide-gray-900"}  text-md `}>
                      <thead className=" rounded-t-2xl ">
                        <tr>

                        <th scope="col" className="pt-7 pb-3 text-lg   ">Date</th>

                          <th scope="col" className="pt-7 pb-3 text-lg   ">Start Time</th>

                          <th scope="col" className="pt-7 pb-3 text-lg   ">End Time</th>

                          <th scope="col" className="pt-7 pb-3 text-lg   ">Duration</th>

                          <th scope="col" className="pt-7 pb-3 text-lg   ">Group Name</th>
                          
                          <th scope="col" className="pt-7 pb-3 text-lg   ">Edit</th>
                          
                          <th scope="col" className="pt-7 pb-3 text-lg   ">Delete</th>

                        </tr>
                      </thead>
                      <tbody className={`divide-y  ${theme == "default" ? "divide-white/20" : "divide-gray-900"} `}>

                        {

                          
                        sessions.map((session) => (
                          <tr key={session.id} className="">
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              {session.start_time.toLocaleDateString()}
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              {session.start_time.toLocaleTimeString()}
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              {session.end_time ? session.end_time.toLocaleTimeString() : '-'}
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              {session.duration ? formatTime(session.duration) : '-'}
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              {session.group}
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              <button 
                                onClick={() => handleEdit(session)}
                                className={`${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf] hover:bg-[#8a94a1]"} py-1 px-6
                                rounded transition duration-300`}
                              >
                                Edit
                              </button>
                            </td>
                            <td className={`${theme == "default" ? "text-gray-300" : " text-black"} text-center py-2 text-sm`}>
                              <button 
                                onClick={() => handleDelete(session.id)}
                                className={`${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E]" : "bg-[#aab3bf]  hover:bg-[#8a94a1]"} py-1 px-6
                                rounded transition duration-300`}
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
