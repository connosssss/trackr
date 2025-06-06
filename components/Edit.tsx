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
  // Local state for form fields
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [editGroup, setEditGroup] = useState<string>('');

  // Initialize form fields when editingSession changes
  useEffect(() => {
    if (editingSession) {
      const startDate = editingSession.start_time.toISOString().split('T')[0];
      const startTime = editingSession.start_time.toTimeString().slice(0, 8); 
      
      let endDate = '';
      let endTime = '';
      if (editingSession.end_time) {
        endDate = editingSession.end_time.toISOString().split('T')[0];
        endTime = editingSession.end_time.toTimeString().slice(0, 8); 
      }
      
      setEditStartDate(startDate);
      setEditStartTime(startTime);
      setEditEndDate(endDate);
      setEditEndTime(endTime);
      setEditGroup(editingSession.group || '');
    }
  }, [editingSession]);

  const handleSaveEdit = async () => {
    if (!editingSession || !user) return;
    
    try {
      const startDateTime = new Date(`${editStartDate}T${editStartTime}`);
      
      let endDateTime = null;
      if (editEndDate && editEndTime) {
        endDateTime = new Date(`${editEndDate}T${editEndTime}`);
      }
      
      let duration = null;
      if (startDateTime && endDateTime) {
        duration = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000);
      }
      
      const updatedSession: TimeSession = {
        ...editingSession,
        start_time: startDateTime,
        end_time: endDateTime,
        duration: duration,
        group: editGroup || null
      };
      
      await updateTimeSession(updatedSession);
      onSave(updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  return (
    <div 
    className="fixed inset-0 bg-black/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-20">
       <div className="bg-gray-700 p-8 rounded-lg w-1/2 max-w-lg">


         <h2 className="text-xl font-semibold mb-4">Edit Time Entry</h2>
         
         <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>

               <label className="block text-sm font-medium mb-1">Start Date</label>
               <input 
                 type="date" 
                 value={editStartDate}
                 onChange={(e) => setEditStartDate(e.target.value)}
                 className="w-full p-2 rounded bg-gray-800 text-white"
               />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">Start Time</label>
               <input 
                 type="text" 
                 value={editStartTime}
                 onChange={(e) => setEditStartTime(e.target.value)}
                 className="w-full p-2 rounded bg-gray-800 text-white"
                 placeholder="HH:MM:SS"
               />
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium mb-1">End Date</label>
               <input 
                 type="date" 
                 value={editEndDate}
                 onChange={(e) => setEditEndDate(e.target.value)}
                 className="w-full p-2 rounded bg-gray-800 text-white"
               />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1">End Time</label>
               <input 
                 type="text" 
                 value={editEndTime}
                 onChange={(e) => setEditEndTime(e.target.value)}
                 className="w-full p-2 rounded bg-gray-800 text-white"
                 placeholder="HH:MM:SS"
               />
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
     </div>
  );
}