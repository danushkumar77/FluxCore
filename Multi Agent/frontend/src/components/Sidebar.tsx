import React, { useState } from "react";
import { 
  Home, Cpu, GitMerge, Box, Activity, Brain, LineChart, BookOpen, Database, 
  Workflow, Sliders, AlertTriangle, Bell, Heart, FileText, Settings, Menu, ChevronLeft, ChevronRight,
  Map, CloudSun, BarChart3, Folder, ShieldAlert,
  DollarSign, Eye, PlayCircle, FileSpreadsheet, Terminal, GitCompare,
  Presentation, Briefcase, Leaf, GraduationCap, Clock, MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar = ({ activePage, setActivePage }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "ai_ops", label: "AI Operations", icon: Cpu },
    { id: "grid_ops", label: "Grid Operations", icon: Map },
    { id: "analytics", label: "Analytics & Forecasts", icon: LineChart },
    { id: "ai_intel", label: "AI Intelligence", icon: Brain },
    { id: "event_bus", label: "Event Bus & Mon", icon: GitMerge },
    { id: "incidents", label: "Incidents & Alerts", icon: ShieldAlert },
    { id: "assets", label: "Assets & Knowledge", icon: Folder },
    { id: "reports", label: "Reports", icon: FileSpreadsheet },
    { id: "sustainability", label: "Sustainability", icon: Leaf },
    { id: "platform", label: "Platform", icon: Settings }
  ];

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-[calc(100vh-80px)] my-4 ml-4 glass-panel flex flex-col relative shrink-0 rounded-2xl border border-white/5 shadow-2xl z-20 backdrop-blur-md"
    >
      {/* Sidebar Header toggle */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        {!isCollapsed && (
          <span className="text-xs font-bold font-mono tracking-widest text-brand-cyan uppercase">
            Platform Menu
          </span>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation menu list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center p-2.5 rounded-xl text-[11px] font-medium transition duration-150 ${
                isActive 
                  ? "bg-brand-cyan/20 text-white border-l-2 border-brand-cyan shadow-[0_0_15px_rgba(0,229,255,0.15)] font-bold" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-cyan shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "text-slate-400"}`} />
              {!isCollapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
