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
  const [durationInput, setDurationInput] = useState<string>('00:00:00');
  const [editGroup, setEditGroup] = useState<string>('');
  const [beInHeatmap, setBeInHeatmap] = useState<boolean>(true);

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
      const duration = editingSession.duration ?? (editingSession.end_time ? Math.max(0, Math.floor((editingSession.end_time.getTime() - editingSession.start_time.getTime()) / 1000)) : 0);
      
      setDurationInput(formatDuration(duration));
      setEditGroup(editingSession.group || '');
      setBeInHeatmap(editingSession.be_in_heatmap ?? true);
    }
  }, [editingSession]);

  const handleStartTimeChange = (value: string) => {
    setStartDateTime(value);
    setDurationInput(formatDuration(getDurationSeconds(value, endDateTime)));
  };

  const handleEndTimeChange = (value: string) => {
    setEndDateTime(value);
    setDurationInput(formatDuration(getDurationSeconds(startDateTime, value)));
  };

  const formatDuration = (seconds: number) => {

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDurationSeconds = (startValue: string, endValue: string) => {
    if (!startValue || !endValue) return 0;
    const difference = (new Date(endValue).getTime() - new Date(startValue).getTime()) / 1000;

    return Number.isFinite(difference) ? Math.max(0, Math.floor(difference)) : 0;
  };

  const parseDuration = (value: string) => {
    const match = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(value);
    if (!match) return null;

    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  };

  const formatLocalDateTime = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return localDate.toISOString().slice(0, 19);
  };

  const handleDurationChange = (value: string) => {
    setDurationInput(value);
    const duration = parseDuration(value);

    if (duration === null || !startDateTime) return;

    const endTime = new Date(new Date(startDateTime).getTime() + duration * 1000);

    setEndDateTime(formatLocalDateTime(endTime));
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !user) return;

    const duration = parseDuration(durationInput);
    if (!startDateTime || duration === null) return;

    try {
      const startTime = new Date(startDateTime);
      const endTime = new Date(startTime.getTime() + duration * 1000);

      const updatedSession: TimeSession = {
        ...editingSession,
        user_id: user.id,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        group: editGroup || null,
        be_in_heatmap: beInHeatmap
      };

      await updateTimeSession(updatedSession);
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
          <label htmlFor="edit-duration" className={`block text-sm ${theme == "default" ? "text-gray-300" : "text-black/70"} mb-1`}>Duration (HH:MM:SS)</label>
          <input
            id="edit-duration"
            type="text"
            inputMode="numeric"
            value={durationInput}
            onChange={(e) => handleDurationChange(e.target.value)}
            onBlur={() => {
              const duration = parseDuration(durationInput);

              if (duration !== null) setDurationInput(formatDuration(duration));
              else setDurationInput(formatDuration(getDurationSeconds(startDateTime, endDateTime)));
            }}
            aria-describedby="edit-duration-help"
            className={`w-full p-2 rounded font-mono ${theme == "default" ? "bg-[#2A292E] text-white" : "bg-[#aab3bf] text-black"}`}
          />
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

        <div>
          <label className="block text-sm font-medium mb-1">Heatmap Visibility</label>
          <button
            onClick={() => setBeInHeatmap(!beInHeatmap)}
            className={`w-full p-2 rounded text-left ${theme == "default" ? " text-white" : " text-black"}  ${beInHeatmap ? ` ${theme ? "bg-[#2A292E]" : "bg-[#aab3bf]"}` : "bg-red-400/10"} flex justify-between items-center transition-all duration-300`}
          >
            <div >{beInHeatmap ? "Included in Heatmap" : "Excluded from Heatmap"}</div>
          </button>
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
          disabled={!startDateTime || !endDateTime || parseDuration(durationInput) === null}
          className={`px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed ${theme == "default" ? "bg-[#0c0b10] hover:bg-[#2A292E] text-white" : "bg-[#aab3bf] hover:bg-[#798391] text-black"}`}
        >
          Save Changes
        </button>
      </div>
    </div>

  );
}
