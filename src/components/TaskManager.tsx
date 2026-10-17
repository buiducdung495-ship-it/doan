import React, { useState } from 'react';
import { User } from '../types';
import { 
  FolderKanban, 
  List, 
  Calendar, 
  GanttChartSquare, 
  Clock, 
  User as UserIcon, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Paperclip, 
  CheckSquare, 
  Settings, 
  Check, 
  ChevronDown, 
  Clock3, 
  CalendarDays, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  ExternalLink,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

interface TaskManagerProps {
  currentUser: User;
  users: User[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  reporter: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignees: string[]; // user IDs
}

const STATIC_PROJECTS: Project[] = [];

export interface CustomTask {
  id: string;
  projectId: string;
  title: string;
  group: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string; 
  estimatedHours: number; 
  actualTime: string; 
  actualHours: number; 
  assigneeId: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  description: string;
  attachments: { name: string; size: string; date: string }[];
  journal: { user: string; action: string; date: string }[];
}

export const INITIAL_TASKS: CustomTask[] = [];

export const TaskManager: React.FC<TaskManagerProps> = ({ currentUser, users }) => {
  // State managers
  const [projects, setProjects] = useState<Project[]>(STATIC_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<CustomTask[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt' | 'timeline'>('list');

  // Modal controls
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isRecordTimeOpen, setIsRecordTimeOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CustomTask | null>(null);
  
  // Status Confirmation Modal State (Image 0)
  const [statusConfirmTask, setStatusConfirmTask] = useState<CustomTask | null>(null);

  // Filter conditions (Image 9)
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterGroups, setFilterGroups] = useState<string[]>(['Thiết kế UI/UX']);
  const [filterReporter, setFilterReporter] = useState<string>('Kim Kim Tiểu Trương');
  const [filterAssigneeSearch, setFilterAssigneeSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('medium');

  
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectAssignees, setNewProjectAssignees] = useState<string[]>([]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: 'PN' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
      name: newProjectName,
      description: newProjectDesc,
      reporter: currentUser.name,
      priority: newProjectPriority,
      dueDate: newProjectDueDate || new Date().toISOString().split('T')[0],
      assignees: newProjectAssignees
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setIsAddProjectOpen(false);
    
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectPriority('medium');
    setNewProjectDueDate('');
    setNewProjectAssignees([]);
  };

  // Form states for adding task
  const [taskName, setTaskName] = useState('');
  const [taskGroup, setTaskGroup] = useState('Thiết kế UI/UX');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('u-1');
  const [taskDescription, setTaskDescription] = useState('');

  // Form states for record time
  const [rtEstTime, setRtEstTime] = useState('4 ngày 6 giờ');
  const [rtDate, setRtDate] = useState('2026-07-10');
  const [rtTime, setRtTime] = useState('14:00');
  const [rtDesc, setRtDesc] = useState('');

  // Helper getters
  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0] || {
    id: '---',
    name: 'Không có dự án',
    description: 'Chưa có dự án nào được tạo.',
    reporter: 'Không có',
    priority: 'low',
    dueDate: '---',
    assignees: []
  };
  
  const getUserObject = (id: string) => {
    return users.find(u => u.id === id) || { name: 'Đoạn Hân Duyệt', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
  };

  // Filter Tasks list based on current selection
  const currentProjectTasks = tasks.filter(t => t.projectId === selectedProjectId);
  
  // Employees only see their assigned tasks
  const myTasks = currentUser.role === 'employee' 
    ? currentProjectTasks.filter(t => t.assigneeId === currentUser.id)
    : currentProjectTasks;

  const filteredTasks = myTasks.filter(t => {
    // Group filter
    if (filterGroups.length > 0 && !filterGroups.some(g => t.group.includes(g))) {
      return false;
    }
    // Priority filter
    if (filterPriority && t.priority !== filterPriority) {
      return false;
    }
    // Assignee search filter
    if (filterAssigneeSearch) {
      const userObj = getUserObject(t.assigneeId);
      if (!userObj.name || !userObj.name.toLowerCase().includes((filterAssigneeSearch || "").toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Split tasks for current list view layout
  const activeTasks = filteredTasks.filter(t => t.status !== 'done');
  const pendingTasks = filteredTasks.filter(t => t.status === 'todo'); 
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  // Handlers
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newTask: CustomTask = {
      id: 'TSK-' + (Date.now() % 1000),
      projectId: selectedProjectId,
      title: taskName,
      group: taskGroup,
      priority: taskPriority,
      estimatedTime: '3 ngày 8 giờ',
      estimatedHours: 32,
      actualTime: '0 giờ',
      actualHours: 0,
      assigneeId: taskAssigneeId,
      status: 'in_progress',
      description: taskDescription || 'Chưa có mô tả chi tiết.',
      attachments: [],
      journal: [
        { user: 'Kim Kim Tiểu Trương', action: 'đã khởi tạo nhiệm vụ mới', date: '2026-07-10 11:13' }
      ]
    };

    setTasks([newTask, ...tasks]);
    setIsAddTaskOpen(false);

    // reset fields
    setTaskName('');
    setTaskDescription('');
  };

  const handleRecordTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const updatedTasks = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          estimatedTime: rtEstTime,
          journal: [
            { 
              user: 'Kim Kim Tiểu Trương', 
              action: `đã ghi lại tiến độ thời gian (Ghi chú: ${rtDesc || 'không có mô tả'})`, 
              date: `${rtDate} ${rtTime}` 
            },
            ...t.journal
          ]
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    // Update selected ref
    const updatedSelected = updatedTasks.find(t => t.id === selectedTask.id);
    if (updatedSelected) setSelectedTask(updatedSelected);

    setIsRecordTimeOpen(false);
    setRtDesc('');
  };

  const handleCheckboxClick = (task: CustomTask) => {
    if (task.status === 'done') {
      // Toggle back to in progress
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'in_progress' } : t));
    } else {
      // Open Image 0 Confirmation modal
      setStatusConfirmTask(task);
    }
  };

  const confirmStatusChange = () => {
    if (!statusConfirmTask) return;

    setTasks(tasks.map(t => {
      if (t.id === statusConfirmTask.id) {
        return {
          ...t,
          status: 'done',
          journal: [
            { user: 'Kim Kim Tiểu Trương', action: 'đã đánh dấu nhiệm vụ hoàn thành và đóng lại', date: '2026-07-10 11:13' },
            ...t.journal
          ]
        };
      }
      return t;
    }));

    setStatusConfirmTask(null);
  };

  return (
    <div className="p-4 sm:p-6 bg-[#ebf0f5] min-h-screen font-sans text-slate-700 flex flex-col justify-between" id="project-management-workspace">
      <div className="space-y-6">
        
        {/* Main Section divided in Left project tree sidebar and center task listing */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Project Panel Switcher & Details (Image 3/4) */}
          <div className="xl:col-span-3 space-y-5">
            <div className="bg-white rounded-xl p-5 border border-[#e2eae8] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Dự án hiện tại
                </label>
                <button 
                  onClick={() => setIsAddProjectOpen(true)}
                  className="p-1 hover:bg-slate-100 rounded text-[#2f80ed] transition-colors"
                  title="Thêm dự án mới"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
              
              {/* Dropdown switch */}
              <div className="relative mb-4">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-[#e2eae8] rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Project list selection */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {projects.map((p) => {
                  const isActive = p.id === selectedProjectId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isActive 
                          ? 'bg-blue-50/70 text-[#2f80ed]' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <FolderKanban size={14} className={isActive ? 'text-[#2f80ed]' : 'text-slate-400'} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                        {tasks.filter(t => t.projectId === p.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LEFT DETAILS PANEL (Image 4 / Image 6 spec) */}
            <div className="bg-white rounded-xl p-5 border border-[#e2eae8] shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
                Chi tiết dự án
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Mã dự án</span>
                  <span className="font-mono font-bold text-slate-800">{selectedProject.id}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Người báo cáo</span>
                  <div className="flex items-center space-x-2">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" alt="reporter" className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-bold text-slate-700 text-[11px]">{selectedProject.reporter}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Người thực hiện</span>
                  <div className="flex items-center -space-x-1.5 pt-0.5">
                    {selectedProject.assignees.map((uid, idx) => (
                      <img
                        key={uid}
                        src={idx % 2 === 0 ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt="assignee"
                        className="w-6 h-6 rounded-full object-cover border-2 border-white"
                      />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-500">
                      +2
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Mức độ ưu tiên</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                    selectedProject.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    selectedProject.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {selectedProject.priority === 'high' ? 'Cao' : selectedProject.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Hạn chót</span>
                  <span className="font-mono font-bold text-slate-800 flex items-center space-x-1.5">
                    <CalendarDays size={12} className="text-blue-500" />
                    <span>{selectedProject.dueDate}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider mb-0.5">Tệp đính kèm</span>
                  <span className="text-[11px] font-bold text-slate-600 flex items-center space-x-1">
                    <Paperclip size={12} className="text-slate-400" />
                    <span>3 tệp đính kèm</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER & RIGHT COLUMN: Task List / Kanban & View details */}
          <div className="xl:col-span-9 space-y-5">
            
            {/* Header action bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-[#e2eae8] shadow-sm">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 hover:text-blue-600 cursor-pointer flex items-center gap-1">
                  <ArrowLeft size={12} /> Quay lại danh sách dự án
                </span>
                <h1 className="text-base font-extrabold text-slate-900 mt-1 flex items-center space-x-2">
                  <span>{selectedProject.name}</span>
                  <Edit size={14} className="text-slate-300 hover:text-slate-500 cursor-pointer" />
                </h1>
              </div>

              {/* Add Task Button */}
              {currentUser.role !== 'employee' && (
                <button
                  onClick={() => {
                    setTaskName('');
                    setTaskDescription('');
                    setIsAddTaskOpen(true);
                  }}
                  className="bg-[#2f80ed] hover:bg-[#1c71dd] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/10 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>＋ Thêm nhiệm vụ</span>
                </button>
              )}
            </div>

            {/* Task list selection and Filter Button */}
            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-[#e2eae8] shadow-sm">
              <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
                {[
                  { id: 'list', label: 'Xem danh sách', icon: List },
                  { id: 'kanban', label: 'Bảng Kanban', icon: FolderKanban },
                  { id: 'gantt', label: 'Biểu đồ Gantt', icon: GanttChartSquare },
                  { id: 'timeline', label: 'Dòng thời gian', icon: Calendar }
                ].map(view => {
                  const Icon = view.icon;
                  return (
                    <button
                      key={view.id}
                      onClick={() => setViewMode(view.id as any)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        viewMode === view.id
                          ? 'bg-white text-[#2f80ed] shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{view.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter Sidebar Trigger */}
              <button
                onClick={() => setIsFilterSidebarOpen(true)}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Filter size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600">Bộ lọc</span>
              </button>
            </div>

            {/* MAIN CONTENT AREA */}
            {currentProjectTasks.length === 0 ? (
              /* EMPTY STATE (Image 4 spec) */
              <div className="bg-white rounded-xl border border-[#e2eae8] p-12 text-center shadow-sm">
                {/* Custom SVG empty board illustration */}
                <div className="w-56 h-48 mx-auto mb-6 flex items-center justify-center">
                  <svg viewBox="0 0 200 150" className="w-full h-full text-slate-300">
                    <rect x="20" y="20" width="160" height="110" rx="10" fill="#f8fafc" stroke="#e2eae8" strokeWidth="2" />
                    <rect x="40" y="40" width="50" height="8" rx="2" fill="#cbd5e0" />
                    <rect x="40" y="55" width="80" height="6" rx="2" fill="#e2e8f0" />
                    <rect x="40" y="70" width="60" height="6" rx="2" fill="#e2e8f0" />
                    {/* Character silhouettes */}
                    <circle cx="150" cy="80" r="12" fill="#63b3ed" opacity="0.8" />
                    <path d="M135 110 C135 95 165 95 165 110 Z" fill="#4299e1" />
                    
                    <circle cx="175" cy="90" r="10" fill="#d6bcfa" />
                    <path d="M162 115 C162 103 188 103 188 115 Z" fill="#9f7aea" />
                    {/* Big Magnifying Glass */}
                    <circle cx="110" cy="85" r="24" stroke="#4299e1" strokeWidth="3.5" fill="none" />
                    <line x1="127" y1="102" x2="145" y2="120" stroke="#4299e1" strokeWidth="4.5" strokeLinecap="round" />
                  </svg>
                </div>
                
                <h3 className="text-sm font-bold text-slate-800">
                  Dự án này chưa có nhiệm vụ nào, hãy thêm chúng.
                </h3>
                <button
                  onClick={() => setIsAddTaskOpen(true)}
                  className="mt-4 bg-[#2f80ed] text-white text-xs font-bold py-2 px-5 rounded-xl hover:bg-[#1c71dd] transition-all cursor-pointer"
                >
                  ＋ Thêm nhiệm vụ
                </button>
              </div>
            ) : (
              <>
                {/* LIST VIEW (Image 3 spec) */}
                {viewMode === 'list' && (
                  <div className="space-y-6">
                    
                    {/* Current Tasks Table */}
                    <div className="bg-white rounded-xl border border-[#e2eae8] overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-[#f0f4f3] bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-black text-[#0a2e24] uppercase tracking-wide">
                          Nhiệm vụ hiện tại ({activeTasks.length})
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                              <th className="py-3 px-4 w-10">Xong</th>
                              <th className="py-3 px-4">Tên nhiệm vụ</th>
                              <th className="py-3 px-4">Thời gian dự kiến</th>
                              <th className="py-3 px-4">Thời gian thực tế</th>
                              <th className="py-3 px-4">Người thực hiện</th>
                              <th className="py-3 px-4">Độ ưu tiên</th>
                              <th className="py-3 px-4">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeTasks.map(task => {
                              const assignee = getUserObject(task.assigneeId);
                              return (
                                <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                                  {/* checkbox */}
                                  <td className="py-3.5 px-4">
                                    <input 
                                      type="checkbox" 
                                      checked={task.status === 'done'}
                                      onChange={() => handleCheckboxClick(task)}
                                      className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                  
                                  {/* Name / title with details link */}
                                  <td className="py-3.5 px-4 font-bold text-slate-800">
                                    <div className="flex items-center space-x-2">
                                      <button 
                                        onClick={() => setSelectedTask(task)}
                                        className="hover:text-[#2f80ed] text-left transition-colors max-w-sm truncate cursor-pointer"
                                      >
                                        {task.title}
                                      </button>
                                      {task.attachments.length > 0 && (
                                        <Paperclip size={11} className="text-slate-400 shrink-0" />
                                      )}
                                      <span className="text-[9px] font-mono font-bold text-slate-300">
                                        {task.id}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                                      {task.group}
                                    </p>
                                  </td>

                                  {/* est time */}
                                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                                    {task.estimatedTime}
                                  </td>

                                  {/* act time */}
                                  <td className="py-3.5 px-4 font-mono font-bold text-[#2f80ed]">
                                    {task.actualTime}
                                  </td>

                                  {/* assignee */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center space-x-2">
                                      <img src={assignee.avatar} alt="avatar" className="w-5.5 h-5.5 rounded-full object-cover" />
                                      <span className="font-semibold text-slate-700 text-[11px]">{assignee.name}</span>
                                    </div>
                                  </td>

                                  {/* priority */}
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                                      task.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                      task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                      'bg-slate-50 text-slate-500 border border-slate-200'
                                    }`}>
                                      {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                    </span>
                                  </td>

                                  {/* status */}
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                      task.status === 'in_progress' ? 'bg-blue-50 text-[#2f80ed] border border-blue-100' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>
                                      {task.status === 'in_progress' ? 'Đang tiến hành' : task.status === 'todo' ? 'Chưa bắt đầu' : 'Đang đánh giá'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pending Tasks Section */}
                    <div className="bg-white rounded-xl border border-[#e2eae8] overflow-hidden shadow-sm">
                      <div className="px-5 py-4 border-b border-[#f0f4f3] bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-black text-[#0a2e24] uppercase tracking-wide">
                          Nhiệm vụ chờ xử lý ({completedTasks.length + pendingTasks.length})
                        </span>
                      </div>
                      
                      <div className="p-3 divide-y divide-slate-100">
                        {tasks.filter(t => t.status === 'todo').map((task) => (
                          <div key={task.id} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50/40 rounded-xl transition-all">
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                {task.id}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-slate-800 truncate hover:text-[#2f80ed] cursor-pointer" onClick={() => setSelectedTask(task)}>
                                  {task.title}
                                </h4>
                                <p className="text-[10px] text-slate-400">{task.group}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 shrink-0">
                              <span className="text-[10px] font-mono text-slate-400">
                                {task.estimatedTime}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* KANBAN VIEW (Image 8 spec) */}
                {viewMode === 'kanban' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    
                    {/* Column 1: Current Task */}
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-[#e2eae8] space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="font-black text-xs text-slate-700 uppercase tracking-wider">
                          Nhiệm vụ hiện tại
                        </h3>
                        <span className="bg-white text-[#2f80ed] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-100 shadow-sm">
                          {activeTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {activeTasks.map(task => {
                          const assignee = getUserObject(task.assigneeId);
                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#2f80ed] hover:shadow-md transition-all cursor-pointer space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[9px] font-bold text-slate-400">
                                  {task.id}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  task.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                                }`}>
                                  {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-800 leading-snug">
                                {task.title}
                              </h4>

                              <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                                <div className="flex items-center space-x-1.5">
                                  <img src={assignee.avatar} alt="assignee" className="w-5 h-5 rounded-full object-cover" />
                                  <span className="truncate max-w-[80px]">{assignee.name}</span>
                                </div>

                                <div className="flex items-center space-x-1 font-mono font-bold text-[#2f80ed] bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50">
                                  <ArrowUpRight size={10} strokeWidth={2.5} />
                                  <span>{task.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Pending Tasks */}
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-[#e2eae8] space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <h3 className="font-black text-xs text-slate-700 uppercase tracking-wider">
                          Nhiệm vụ chờ bắt đầu
                        </h3>
                        <span className="bg-white text-slate-500 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                          {tasks.filter(t => t.status === 'todo').length}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {tasks.filter(t => t.status === 'todo').map(task => {
                          const assignee = getUserObject(task.assigneeId);
                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:border-[#2f80ed] hover:shadow-md transition-all cursor-pointer space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[9px] font-bold text-slate-400">
                                  {task.id}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-50 text-slate-500">
                                  {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-800 leading-snug">
                                {task.title}
                              </h4>

                              <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                                <div className="flex items-center space-x-1.5">
                                  <img src={assignee.avatar} alt="assignee" className="w-5 h-5 rounded-full object-cover" />
                                  <span className="truncate max-w-[80px]">{assignee.name}</span>
                                </div>

                                <div className="flex items-center space-x-1 font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  <ArrowDownRight size={10} />
                                  <span>{task.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* GANTT & TIMELINE VIEW */}
                {(viewMode === 'gantt' || viewMode === 'timeline') && (
                  <div className="bg-white p-6 rounded-xl border border-[#e2eae8] shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                        {viewMode === 'gantt' ? 'Biểu đồ kế hoạch Gantt' : 'Dòng thời gian tương tác'}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">Tháng 7, 2026</span>
                    </div>

                    <div className="space-y-4">
                      {filteredTasks.slice(0, 5).map((t, idx) => {
                        const assignee = getUserObject(t.assigneeId);
                        return (
                          <div key={t.id} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4 truncate font-bold text-xs text-slate-700">
                              {t.title}
                            </div>
                            <div className="col-span-8 h-8 bg-slate-50 rounded-xl relative overflow-hidden border border-slate-100">
                              {/* Slanted progress line */}
                              <div 
                                className="absolute h-full rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 border-r border-blue-600/30 flex items-center justify-end px-3 text-[9px] font-bold text-white shadow-sm"
                                style={{ 
                                  left: `${(idx * 12) + 10}%`, 
                                  width: `${30 + (idx * 10)}%` 
                                }}
                              >
                                <div className="flex items-center space-x-1 font-mono">
                                  <span>{t.estimatedTime}</span>
                                  <img src={assignee.avatar} alt="assign" className="w-4 h-4 rounded-full object-cover border border-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TASK DETAILS DRAWER/MODAL (Image 6 spec) */}
      {selectedTask && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-[#0c1a30]/30 backdrop-blur-md" onClick={() => setSelectedTask(null)} />
          
          {/* Drawer Body */}
          <div className="w-full max-w-4xl bg-white h-full relative z-10 shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-left font-sans text-slate-700">
            
            <div className="p-6 space-y-6">
              {/* Back link and Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Quay lại danh sách dự án</span>
                </button>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Task Header info */}
              <div>
                <p className="text-[10px] font-bold text-[#2f80ed] font-mono tracking-widest uppercase">
                  {selectedProject.id} · {selectedProject.name}
                </p>
                <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center space-x-2">
                  <span>{selectedTask.title}</span>
                  <Edit size={14} className="text-slate-300 hover:text-slate-500 cursor-pointer" />
                </h2>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Task group, Description, Attachments, Journal (takes 8 cols) */}
                <div className="lg:col-span-8 space-y-5">
                  
                  {/* Task group selector dropdown */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                      Nhóm nhiệm vụ
                    </label>
                    <div className="relative w-48">
                      <select
                        value={selectedTask.group}
                        onChange={(e) => setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, group: e.target.value } : t))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
                        <option value="Thiết kế tương tác">Thiết kế tương tác</option>
                        <option value="Tích hợp Backend">Tích hợp Backend</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                      Mô tả chi tiết
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700 leading-relaxed min-h-[100px]">
                      {selectedTask.description}
                    </div>
                  </div>

                  {/* File Attachments (Image 6 spec - 3 clear file attachments) */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Tệp đính kèm ({selectedTask.attachments.length})
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTask.attachments.map((file, idx) => (
                        <div key={idx} className="bg-white border border-[#e2eae8] p-3 rounded-xl flex items-center space-x-3 hover:border-blue-200 transition-all">
                          <div className="w-10 h-10 bg-blue-50 text-[#2f80ed] rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0 border border-blue-100">
                            PNG
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {file.size} · {file.date}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {selectedTask.attachments.length === 0 && (
                        <div className="col-span-2 py-4 text-center border-2 border-dashed border-slate-100 rounded-xl text-[11px] text-slate-400">
                          Chưa có tệp đính kèm nào cho nhiệm vụ này.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Journal Activity Logs (Image 6 spec) */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Nhật ký hoạt động
                    </label>
                    
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3.5 max-h-48 overflow-y-auto">
                      {selectedTask.journal.map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" alt="user" className="w-5.5 h-5.5 rounded-full object-cover border border-[#e2eae8]" />
                          <div>
                            <p className="text-[11px] text-slate-700">
                              <span className="font-bold text-slate-900">{log.user}</span> {log.action}
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{log.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right side: Time progress & Record Time Button (takes 4 cols) */}
                <div className="lg:col-span-4 space-y-5 bg-slate-50/50 p-5 rounded-xl border border-[#e2eae8]">
                  
                  {/* Spent Time Progress circle */}
                  <div className="text-center space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      Tiến độ thời gian
                    </span>
                    
                    {/* SVG Progress Circle */}
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#e2eae8" strokeWidth="10" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#2f80ed"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${Math.min(100, Math.round((selectedTask.actualHours / selectedTask.estimatedHours) * 100)) * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xs font-black text-slate-800">
                          {Math.round((selectedTask.actualHours / selectedTask.estimatedHours) * 100)}%
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Đã dùng</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 mt-1 font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Đã dùng:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedTask.actualTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dự kiến:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedTask.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Record Time Action Button */}
                  <button
                    onClick={() => {
                      setRtEstTime(selectedTask.estimatedTime);
                      setRtDesc('');
                      setIsRecordTimeOpen(true);
                    }}
                    className="w-full bg-[#2f80ed] hover:bg-[#1c71dd] text-white py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/15 cursor-pointer text-center block"
                  >
                    Ghi lại thời gian
                  </button>

                  <div className="pt-3 border-t border-slate-200/60 text-[10px] text-slate-400 font-medium space-y-1.5">
                    <p>Ưu tiên: <b className="text-slate-600 uppercase">{selectedTask.priority === 'high' ? 'Cao' : selectedTask.priority === 'medium' ? 'Trung bình' : 'Thấp'}</b></p>
                    <p>Người báo cáo: <b className="text-slate-600">Kim Kim Tiểu Trương</b></p>
                    <p>Hạn chót: <b className="text-slate-600">{selectedProject.dueDate}</b></p>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom row: Watermark & closing info */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[10px] text-slate-400">
              <span>Mã nhiệm vụ: {selectedTask.id}</span>
              <span className="font-bold">Số TikTok: 777524698</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CONFIRM STATUS CHANGE MODAL (Image 0 spec) */}
      {statusConfirmTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-[#0c1a30]/45 backdrop-blur-md" onClick={() => setStatusConfirmTask(null)} />
          
          {/* Modal Container */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-md z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-[#0a2e24] text-sm">
                Bạn có chắc chắn muốn sửa đổi trạng thái nhiệm vụ không?
              </h3>
              <button 
                onClick={() => setStatusConfirmTask(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              
              {/* Male Character sitting at desk with laptop (Image 0 Illustration) */}
              <div className="w-full h-40 bg-gradient-to-b from-[#f3f7ff] to-white rounded-xl p-4 flex items-center justify-center border border-blue-50/50">
                <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#2f80ed]">
                  {/* Floating Checklist checkmark icons */}
                  <rect x="70" y="10" width="16" height="16" rx="4" fill="#34d399" opacity="0.8" />
                  <path d="M74 18 L77 21 L82 14" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  
                  {/* Male Character silhouette at desk */}
                  <circle cx="50" cy="38" r="14" fill="#fed7d7" />
                  <path d="M42 28 Q50 32 58 28" stroke="#1a202c" strokeWidth="2.5" fill="none" />
                  <circle cx="46" cy="36" r="1" fill="#1a202c" />
                  <circle cx="54" cy="36" r="1" fill="#1a202c" />
                  <path d="M48 42 Q50 44 52 42" stroke="#1a202c" strokeWidth="1" fill="none" />
                  
                  {/* Coder Sweater */}
                  <path d="M32 75 C32 60 68 60 68 75 Z" fill="#2f80ed" />
                  {/* Laptop mockup */}
                  <polygon points="25,82 75,82 70,88 30,88" fill="#a0aec0" />
                  <rect x="35" y="72" width="30" height="10" rx="1" fill="#e2e8f0" stroke="#718096" strokeWidth="1" />
                </svg>
              </div>

              {/* Subtext */}
              <div>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                  Nhiệm vụ này sẽ chuyển sang phần 'Đã hoàn thành' và sẽ bị đóng.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setStatusConfirmTask(null)}
                  className="px-4.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="px-4.5 py-2 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Xác nhận sửa đổi
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      
      {/* ========================================================= */}
      {/* MODAL: ADD NEW PROJECT */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={() => setIsAddProjectOpen(false)} />
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-[#2f80ed]/10 flex items-center justify-center text-[#2f80ed]">
                  <FolderKanban size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Tạo dự án mới</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Thiết lập thông tin cơ bản cho dự án</p>
                </div>
              </div>
              <button onClick={() => setIsAddProjectOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                <Trash2 size={16} className="rotate-45" /> {/* Use Trash2 as X if X is not imported, wait, let's use Plus rotated */}
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAddProject} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tên dự án <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Nhập tên dự án..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả dự án</label>
                <textarea
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về mục tiêu dự án..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Mức độ ưu tiên</label>
                  <select
                    value={newProjectPriority}
                    onChange={e => setNewProjectPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Hạn chót</label>
                  <input
                    type="date"
                    value={newProjectDueDate}
                    onChange={e => setNewProjectDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#2f80ed] focus:ring-1 focus:ring-[#2f80ed] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Thành viên tham gia</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center space-x-2.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={newProjectAssignees.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProjectAssignees(prev => [...prev, u.id]);
                          } else {
                            setNewProjectAssignees(prev => prev.filter(id => id !== u.id));
                          }
                        }}
                        className="rounded text-[#2f80ed] focus:ring-[#2f80ed]"
                      />
                      <div className="flex items-center space-x-2">
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-slate-700">{u.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProjectOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2f80ed] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <FolderKanban size={14} />
                  <span>Tạo dự án</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ADD NEW TASK MODAL (Image 5 spec) */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={() => setIsAddTaskOpen(false)} />
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Thêm nhiệm vụ
              </h3>
              <button 
                onClick={() => setIsAddTaskOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 transition-all font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="p-6 space-y-4">
              {/* Task Name */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Tên nhiệm vụ
                </label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Ví dụ: Thiết kế UI Đăng nhập + Đăng ký"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              {/* Task Group & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Nhóm nhiệm vụ
                  </label>
                  <select
                    value={taskGroup}
                    onChange={(e) => setTaskGroup(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
                    <option value="Thiết kế tương tác">Thiết kế tương tác</option>
                    <option value="Tích hợp Backend">Tích hợp Backend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Mức ưu tiên
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    required
                    value={taskStartDate}
                    onChange={(e) => setTaskStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    required
                    value={taskEndDate}
                    onChange={(e) => setTaskEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Người thực hiện
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                  <option value="u-1">Đoạn Hân Duyệt</option>
                  <option value="u-2">Vương Nhất Dược</option>
                  <option value="u-3">Lý Hạc Loan</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Thêm một số văn bản mô tả..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RECORD TIME MODAL (Image 7 spec) */}
      {isRecordTimeOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0c1a30]/40 backdrop-blur-md" onClick={() => setIsRecordTimeOpen(false)} />
          
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden relative animate-scale-up font-sans text-slate-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">
                Ghi lại thời gian
              </h3>
              <button 
                onClick={() => setIsRecordTimeOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-700 transition-all font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordTimeSubmit} className="p-6 space-y-4">
              
              {/* Clocks, gears illustration */}
              <div className="w-full h-36 bg-gradient-to-b from-[#f3f7ff] to-white rounded-xl p-4 flex items-center justify-center border border-blue-50/50 relative overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#2f80ed]">
                  {/* Gear */}
                  <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 3" className="animate-spin" />
                  {/* Clock outline */}
                  <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <line x1="50" y1="50" x2="50" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <line x1="50" y1="50" x2="68" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>

                {/* Spent Circular indicators in miniature */}
                <div className="absolute right-6 top-6 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 text-[9px] font-mono font-bold text-[#2f80ed]">
                  Đã dùng: {selectedTask.actualTime}
                </div>
              </div>

              {/* Time progression info */}
              <div className="text-center">
                <p className="text-xs font-extrabold text-slate-700">
                  Theo dõi thời gian dự án & tiến độ công việc trực quan
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Đã dùng: {selectedTask.actualTime} / Dự kiến: {selectedTask.estimatedTime}
                </p>
              </div>

              {/* Estimated Time input */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Thời gian dự kiến
                </label>
                <input
                  type="text"
                  required
                  value={rtEstTime}
                  onChange={(e) => setRtEstTime(e.target.value)}
                  placeholder="Ví dụ: 4 ngày 6 giờ"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              {/* Date & Time Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Chọn ngày
                  </label>
                  <input
                    type="date"
                    required
                    value={rtDate}
                    onChange={(e) => setRtDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                    Chọn thời gian
                  </label>
                  <input
                    type="time"
                    required
                    value={rtTime}
                    onChange={(e) => setRtTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Work Description */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                  Mô tả công việc
                </label>
                <textarea
                  rows={3}
                  required
                  value={rtDesc}
                  onChange={(e) => setRtDesc(e.target.value)}
                  placeholder="Thêm một số mô tả công việc..."
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordTimeOpen(false)}
                  className="px-4.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: FILTER TASK LIST SIDEBAR (Image 9 spec) */}
      {isFilterSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Blurred overlay */}
          <div className="absolute inset-0 bg-[#0c1a30]/30 backdrop-blur-md" onClick={() => setIsFilterSidebarOpen(false)} />
          
          {/* Drawer Body */}
          <div className="w-full max-w-sm bg-white h-full relative z-10 shadow-2xl overflow-y-auto flex flex-col justify-between animate-slide-left font-sans text-slate-700">
            
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <Filter size={15} className="text-blue-500" />
                  <span>Bộ lọc</span>
                </h3>
                <button 
                  onClick={() => setIsFilterSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 text-xs">
                {/* Time period */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                    Chu kỳ thời gian
                  </label>
                  <input
                    type="date"
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Task Group */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Nhóm nhiệm vụ
                  </label>
                  
                  <div className="space-y-1.5">
                    {['Thiết kế UI/UX', 'Thiết kế tương tác', 'Nhóm R&D', 'Nhóm Kiểm thử', 'Nhóm Quản lý dự án'].map(group => {
                      const isChecked = filterGroups.includes(group);
                      return (
                        <label key={group} className="flex items-center space-x-2.5 font-bold text-slate-600 hover:text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFilterGroups(filterGroups.filter(g => g !== group));
                              } else {
                                setFilterGroups([...filterGroups, group]);
                              }
                            }}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span>{group}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Reporter Checkboxes with avatars */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Người báo cáo
                  </label>

                  <div className="space-y-2">
                    {[
                      { name: 'Kim Kim Tiểu Trương', checked: true, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
                      { name: 'Vương Nhất Dược', checked: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
                      { name: 'Lý Hạc Loan', checked: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
                    ].map(reporter => (
                      <label key={reporter.name} className="flex items-center justify-between font-bold text-slate-600 hover:text-slate-800 cursor-pointer">
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            defaultChecked={reporter.name === filterReporter}
                            onChange={() => setFilterReporter(reporter.name)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <img src={reporter.avatar} alt="avatar" className="w-5.5 h-5.5 rounded-full object-cover" />
                          <span className="truncate max-w-[150px]">{reporter.name}</span>
                        </div>
                        <span className="text-[9px] bg-slate-50 text-slate-400 border border-slate-200 px-1  rounded font-mono font-bold">
                          Chủ sở hữu
                        </span>
                      </label>
                    ))}
                    <button type="button" className="text-[10px] text-blue-500 hover:text-blue-600 font-extrabold mt-1">
                      Xem thêm...
                    </button>
                  </div>
                </div>

                {/* Assignee search input & tags */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Người thực hiện
                  </label>
                  
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={filterAssigneeSearch}
                      onChange={(e) => setFilterAssigneeSearch(e.target.value)}
                      placeholder="Tìm kiếm..."
                      className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none font-medium text-slate-800"
                    />
                  </div>

                  {/* Assignee Tag selection list */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Đoạn Hân Duyệt', 'Kim Kim Tiểu Trương', 'Lý Hạc Loan', 'Vương Nhất Dược'].map(name => {
                      const isActive = filterAssigneeSearch && name && (filterAssigneeSearch || "").toLowerCase().includes((name.split(' ')[0] || "").toLowerCase());
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFilterAssigneeSearch(isActive ? '' : name)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-[#2f80ed] border-blue-200 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">
                    Mức ưu tiên
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  >
                    <option value="">Tất cả</option>
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Submit Action Button (Image 9 Submit Filter (3) specification) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                onClick={() => {
                  setFilterGroups(['Thiết kế UI/UX']);
                  setFilterReporter('Kim Kim Tiểu Trương');
                  setFilterAssigneeSearch('');
                  setFilterPriority('medium');
                  setIsFilterSidebarOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all text-center cursor-pointer"
              >
                Đặt lại
              </button>
              
              <button
                onClick={() => setIsFilterSidebarOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-xs font-bold transition-all text-center shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Gửi bộ lọc (3)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER WATERMARK WITH TIKTOK ID (Image 3/4/6/8/9 spec) */}
      <footer className="mt-8 border-t border-[#e2eae8] pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-sans tracking-wide">
        <p className="font-semibold text-[#0a2e24]">DOCUSYS Quản trị & Văn bản © 2026</p>
        <div className="flex items-center space-x-2 font-mono bg-[#f4f7f6] border border-[#e2eae8] px-3 py-1 rounded-full text-[9px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2f80ed] animate-pulse" />
          <span className="text-slate-500 select-all">Số TikTok: 777524698</span>
        </div>
      </footer>
    </div>
  );
};
