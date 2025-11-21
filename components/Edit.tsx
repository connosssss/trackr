'use client';

import { useState, useEffect } from 'react';
import { updateTimeSession, deleteTimeSession, TimeSession } from "@/utils/timeSessionsDB";
import { User } from '@supabase/supabase-js';
import { useTheme } from "@/context/ThemeContext";

interface EditProps {

  editingSession: TimeSession;
  onCancel: () => void;
  onSave: (updatedSession: TimeSession) => void | Promise<void>;
  onDelete: () => void;
  user: User | null;
}

export default function Edit({
  editingSession,
  onCancel,
  onSave,
  onDelete,
  user
}: EditProps) {

  const { theme } = useTheme();
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

  const handleDelete = async () => {
    if (!editingSession || !user) return;

    let id = editingSession.id;

    try {
      await deleteTimeSession(id);
      onDelete();
    }
    catch (error) {
      console.error("Error deleting session:", error);
    }
  };


  return (
    <div className={`${theme == "default" ? "bg-[#1B1A1F] text-white" : "bg-[#ffffff] text-black"} p-8 rounded-lg w-full max-w-lg mx-4 z-50`} onClick={(e) => e.stopPropagation()}>


      <h2 className="text-xl font-semibold mb-4">Edit Time Entry</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            step="1"
            className={`w-full p-2 rounded ${theme == "default" ? "bg-[#2A292E] text-white" : "bg-[#aab3bf] text-black"}`}
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
              className={`flex-1 p-2 rounded ${theme == "default" ? "bg-[#2A292E] text-white" : "bg-[#aab3bf] text-black"} disabled:opacity-50`}
            />

          </div>
        </div>

        <div className={`${theme == "default" ? "bg-[#2A292E]" : "bg-[#aab3bf]"} p-3 rounded`}>
          <div className={`text-sm ${theme == "default" ? "text-gray-300" : "text-black/70"} mb-1`}>Duration</div>
          <div className={`text-lg font-mono ${theme == "default" ? "text-white" : "text-black"}`}>
            {formatDuration(calculateDuration())}
          </div>
        </div>


        <div>

          <label className="block text-sm font-medium mb-1">Group</label>
          <input
            type="text"
            value={editGroup}
            onChange={(e) => setEditGroup(e.target.value)}
            className={`w-full p-2 rounded ${theme == "default" ? "bg-[#2A292E] text-white" : "bg-[#aab3bf] text-black"}`}
            placeholder="Group name"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-3">


        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E] text-white" : "bg-[#aab3bf] hover:bg-[#798391] text-black"}`}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className={`px-4 py-2 rounded ${theme == "default" ? "bg-red-600/30 hover:bg-red-500/30 text-white" : "bg-red-600/20 hover:bg-red-500/20 text-black"}`}
        >
          Delete
        </button>
        <button
          onClick={handleSaveEdit}
          className={`px-4 py-2 rounded ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E] text-white" : "bg-[#aab3bf] hover:bg-[#798391] text-black"}`}
        >
          Save Changes
        </button>
      </div>
    </div>

  );
}