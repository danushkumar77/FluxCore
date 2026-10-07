import React, { useState } from "react";
import { Briefcase, CheckCircle2, Circle, Plus, Trash2, ShieldAlert } from "lucide-react";
import { MOCK_INCIDENTS } from "../../services/mockData";

export const OperatorWorkspace = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Acknowledge Substation A core temp warning", completed: true },
    { id: 2, text: "Verify battery state-of-health data", completed: false },
    { id: 3, text: "Compile daily reliability report export", completed: false }
  ]);
  const [taskInput, setTaskInput] = useState("");
  const [shiftSummary, setShiftSummary] = useState("Shift Logs (21:00 - 22:00): Initiated grid bootstrap, verified active WebSocket connections. Cleared transient sag warning on transformer Feeder 4 breaker.");

  const toggleTask = (id: number) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text: taskInput, completed: false }
    ]);
    setTaskInput("");
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto max-h-[85vh] p-1 font-mono text-xs">
      
      {/* 1. Header status */}
      <div className="p-4 glass-panel rounded-xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Briefcase className="w-5 h-5 text-brand-cyan animate-pulse" />
          <div>
            <h3 className="font-bold text-white uppercase tracking-wider">Operator Workstation</h3>
            <p className="text-[10px] text-slate-400">Assigned task cards, active incident queues, and shift log overrides.</p>
          </div>
        </div>
      </div>

      {/* 2. Workspace splitted lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Column 1 & 2: Assigned Incidents and Shift summary */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Active incidents */}
          <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
            <h4 className="font-bold text-brand-rose uppercase flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1 text-brand-rose animate-pulse" /> Assigned Grid Incidents
            </h4>
            <div className="space-y-2">
              {MOCK_INCIDENTS.map((inc) => (
                <div key={inc.id} className="p-3 bg-slate-900/40 border border-white/5 rounded flex justify-between items-center text-[10px]">
                  <div>
                    <span className="font-bold text-white block">{inc.title}</span>
                    <span className="text-[9px] text-slate-500">ID: {inc.id} | Severity: {inc.severity}</span>
                  </div>
                  <span className="bg-brand-rose/10 text-brand-rose border border-brand-rose/20 px-2 py-0.5 rounded uppercase font-bold text-[8px]">
                    {inc.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shift summaries */}
          <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3">
            <h4 className="font-bold text-white uppercase text-[10px]">Active Shift Summary Journal</h4>
            <textarea 
              value={shiftSummary}
              onChange={(e) => setShiftSummary(e.target.value)}
              rows={4}
              className="w-full bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded p-2.5 text-[10px] text-slate-300 outline-none transition font-mono leading-relaxed"
            />
          </div>

        </div>

        {/* Column 3: Personal TODO task checklist */}
        <div className="p-4 glass-panel rounded-xl border border-white/5 space-y-3 flex flex-col justify-between h-[380px]">
          <div>
            <h4 className="font-bold text-brand-cyan uppercase pb-2 border-b border-white/5">Shift Checklist</h4>
            
            {/* Input field */}
            <div className="flex gap-1.5 pt-2">
              <input 
                type="text" 
                placeholder="Add checklist item..." 
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1 bg-slate-900/60 border border-white/5 focus:border-brand-cyan/40 rounded px-2.5 py-1 text-[10px] text-white outline-none"
              />
              <button 
                onClick={addTask}
                className="bg-brand-cyan hover:bg-brand-cyan/85 text-slate-950 p-1.5 rounded transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-slate-900/40 rounded border border-white/5 text-[10px]">
                  <div 
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-white transition"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={task.completed ? "line-through text-slate-500" : ""}>{task.text}</span>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-500 hover:text-brand-rose transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 text-[9px] text-slate-500 text-right">
            Done: {tasks.filter(t => t.completed).length} / {tasks.length}
          </div>
        </div>

      </div>

    </div>
  );
};
