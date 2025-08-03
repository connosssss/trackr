'use client';

import { useState, useEffect } from 'react';
import { updateTimeSession } from "@/utils/timeSessionsDB";
import { User } from '@supabase/supabase-js';

interface TimeSession {
  id: string;
  user_id?: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  group: string | null;
}

interface EditProps {

  editingSession: TimeSession;
  onCancel: () => void;
  onSave: (updatedSession: TimeSession) => void;
  user: User | null;
}

export default function Edit({
  editingSession,
  onCancel,
  onSave,
  user
}: EditProps) {

  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [editGroup, setEditGroup] = useState<string>('');

  useEffect(() => {
    if (editingSession) {
      const startTime = new Date(editingSession.start_time);
      const startOffset = startTime.getTimezoneOffset() * 60000;
      const localStartTime = new Date(startTime.getTime() - startOffset);
      const startt = localStartTime.toISOString().slice(0, 19);
      
      let endt = '';
      if (editingSession.end_time) {
        const endTime = new Date(editingSession.end_time);
        const endOffset = endTime.getTimezoneOffset() * 60000;
        const localEndTime = new Date(endTime.getTime() - endOffset);
        endt = localEndTime.toISOString().slice(0, 19);
      }
      
      setStartDateTime(startt);
      setEndDateTime(endt);
      setEditGroup(editingSession.group || '');
    }
  }, [editingSession]);

  const handleStartTimeChange = (value: string) => {
    setStartDateTime(value);
  };

  const handleEndTimeChange = (value: string) => {
    setEndDateTime(value);
  };

  const calculateDuration = () => {
    if (!startDateTime) return 0;
    
    const start = new Date(startDateTime);
    let end = new Date(endDateTime);
    
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));

  };


  const formatDuration = (seconds: number) => {

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !user) return;
    
    try {
      const startTime = new Date(startDateTime);
      
      let endTime = null;
      let duration = null;
      
      endTime = new Date(endDateTime);
      duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const updatedSession: TimeSession = {
        ...editingSession,
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        group: editGroup || null
      };
      
      await updateTimeSession(updatedSession as any);
      onSave(updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  return (
       <div className="bg-gray-700 p-8 rounded-lg w-full max-w-lg mx-4 z-50">


         <h2 className="text-xl font-semibold mb-4">Edit Time Entry</h2>
         
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium mb-1">Start Time</label>
             <input 
               type="datetime-local" 
               value={startDateTime}
               onChange={(e) => handleStartTimeChange(e.target.value)}
               step="1"
               className="w-full p-2 rounded bg-gray-800 text-white"
             />
           </div>
           
           <div>
            
             <label className="block text-sm font-medium mb-1">End Time</label>
             <div className="flex gap-2">

               <input 
                 type="datetime-local" 
                 value={endDateTime}
                 onChange={(e) => handleEndTimeChange(e.target.value)}
                 step="1"
                 className="flex-1 p-2 rounded bg-gray-800 text-white disabled:opacity-50"
               />

             </div>
           </div>

           <div className="bg-gray-800 p-3 rounded">
             <div className="text-sm text-gray-300 mb-1">Duration</div>
             <div className="text-lg font-mono text-white">
               {formatDuration(calculateDuration())}
             </div>
           </div>
           

           <div>

             <label className="block text-sm font-medium mb-1">Group</label>
             <input 
               type="text" 
               value={editGroup}
               onChange={(e) => setEditGroup(e.target.value)}
               className="w-full p-2 rounded bg-gray-800 text-white"
               placeholder="Group name"
             />
           </div>
         </div>
         
         <div className="flex justify-end mt-6 gap-3">


           <button
             onClick={onCancel}
             className="px-4 py-2 bg-gray-600 text-white rounded 
             "
           >
             Cancel
           </button>
           <button
             onClick={handleSaveEdit}
             className="px-4 py-2 bg-gray-600 text-white rounded 
             "
           >
             Save Changes
           </button>
         </div>
       </div>
     
  );
}