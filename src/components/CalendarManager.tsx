import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Pin,
  PinOff,
  MoreVertical,
  Trash2,
  Film,
  Users as UsersIcon,
  FolderOpen,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  CalendarDays,
  Edit3,
  FileText,
  Paperclip,
  Upload,
  X,
  Send,
  Activity,
  ChevronDown,
  ChevronUp,
  Download,
  UserCheck,
  FileCheck2,
  Sparkles
} from 'lucide-react';

export interface CalendarManagerProps {
  currentUser: User;
  users: User[];
  events?: EventItem[];
  setEvents?: React.Dispatch<React.SetStateAction<EventItem[]>>;
  calendarNotes?: CalendarNote[];
  setCalendarNotes?: React.Dispatch<React.SetStateAction<CalendarNote[]>>;
}

export type EventStatus = 'created' | 'upcoming' | 'active' | 'completed' | 'cancelled' | 'delayed';
export type EventPriority = 'high' | 'medium' | 'low';

export interface DocumentAssignment {
  id: string;
  userId: string;
  userName: string;
  role: 'approver' | 'executor' | 'viewer';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  feedback?: string;
}

export interface DocumentHistoryEntry {
  id: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface EventAddition {
  id: string;
  text: string;
  files: string[];
  members: string[];
  timestamp: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'folder' | 'group' | 'cinema' | 'person';
  time: string;
  duration: string;
  status: EventStatus;
  priority: EventPriority;
  isPinned: boolean;
  assignees: string[];
  expiresAt?: string; // Datetime ISO for auto-expiration
  description?: string;
  docNumber?: string;
  urgency?: 'normal' | 'urgent' | 'very_urgent';
  confidentiality?: 'normal' | 'confidential' | 'secret';
  attachments?: string[];
  assignments?: DocumentAssignment[];
  history?: DocumentHistoryEntry[];
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: string;
  signatureType?: string;
  stampType?: string;
  additions?: EventAddition[];
}

export interface CalendarNote {
  id: string;
  dateStr: string; // YYYY-MM-DD
  title: string;
  content?: string;
  color: 'red' | 'blue' | 'green' | 'orange' | 'purple';
  priority: EventPriority;
  progress: number; // 0 to 100
  isCompleted: boolean;
  // Document integrations:
  docNumber?: string;
  urgency?: 'normal' | 'urgent' | 'very_urgent';
  confidentiality?: 'normal' | 'confidential' | 'secret';
  attachments?: string[];
  assignments?: DocumentAssignment[];
  history?: DocumentHistoryEntry[];
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: string;
  signatureType?: string;
  stampType?: string;
}

const INITIAL_EVENTS: EventItem[] = [
  { id: 'ev-1', category: 'group', title: 'Giới thiệu phòng ban mới (IT & Product)', time: 'Hôm nay | 18:00 chiều', duration: '2 giờ', status: 'upcoming', priority: 'high', isPinned: true, assignees: ['Kim Kim Tiểu Trương', 'Vương Nhất Dược'] },
  { id: 'ev-2', category: 'person', title: 'Sinh nhật Vương An Na (Anna Wang)', time: 'Ngày mai | 09:00 sáng', duration: '1g 30ph', status: 'upcoming', priority: 'medium', isPinned: false, assignees: ['Vương An Na', 'Đoạn Hân Duyệt'] },
  { id: 'ev-3', category: 'cinema', title: 'Tối thứ Sáu chiếu phim: Interstellar', time: '14 tháng 9 | 09:00 sáng', duration: '4 ngày', status: 'created', priority: 'low', isPinned: false, assignees: ['Lý Hạc Loan'] },
  { id: 'ev-4', category: 'folder', title: 'Đánh giá Trải nghiệm người dùng & Brainstorming', time: 'Hôm nay | 13:00 chiều', duration: '1 giờ', status: 'active', priority: 'high', isPinned: true, assignees: ['Kim Kim Tiểu Trương', 'Lý Hạc Loan', 'Vương Nhất Dược'] },
  { id: 'ev-5', category: 'cinema', title: 'Tối chiếu phim Thiết kế UI: Blade Runner 2049', time: 'Ngày mai | 20:00 tối', duration: '1 ngày', status: 'created', priority: 'low', isPinned: false, assignees: ['Đoạn Hân Duyệt', 'Vương An Na'] },
  { id: 'ev-6', category: 'person', title: 'Sinh nhật Đoạn Hân Duyệt (Duan Xinyue)', time: '15 tháng 9 | 09:00 sáng', duration: '5 ngày', status: 'upcoming', priority: 'medium', isPinned: false, assignees: ['Đoạn Hân Duyệt'] },
  { id: 'ev-10', category: 'person', title: 'Tiệc tối thuyết trình Kim Kim Tiểu Trương', time: 'Hôm nay | 19:30 tối', duration: '3g 30ph', status: 'active', priority: 'high', isPinned: false, assignees: ['Kim Kim Tiểu Trương'] },
];

export const CalendarManager: React.FC<CalendarManagerProps> = (props) => {
  const { currentUser, users } = props;
  const [activeTab, setActiveTab] = useState<'events' | 'calendar'>('calendar');
  
  const [localEvents, setLocalEvents] = useState<EventItem[]>(() => {
    const saved = localStorage.getItem('sio_calendar_events_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const events = props.events ?? localEvents;
  const setEvents = props.setEvents ?? setLocalEvents;

  const [isAdding, setIsAdding] = useState(false);

  // Calendar Grid state
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedNoteDay, setSelectedNoteDay] = useState<string | null>(null);
  
  // Note Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteColor, setNoteColor] = useState<'red' | 'blue' | 'green' | 'orange' | 'purple'>('blue');
  const [noteContent, setNoteContent] = useState('');
  const [notePriority, setNotePriority] = useState<EventPriority>('medium');
  const [noteProgress, setNoteProgress] = useState(0);
  const [editingNote, setEditingNote] = useState<CalendarNote | null>(null);

  // Notes filtering/searching state
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [noteFilterPriority, setNoteFilterPriority] = useState<string>('all');
  const [noteFilterCompleted, setNoteFilterCompleted] = useState<string>('all');

  const [eventFilterPriority, setEventFilterPriority] = useState<string>('all');
  const [eventFilterCategory, setEventFilterCategory] = useState<string>('all');

  // Dynamic initial notes relative to today so they always load beautifully!
  const [localNotes, setLocalNotes] = useState<CalendarNote[]>(() => {
    const saved = localStorage.getItem('sio_calendar_notes_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });
  const calendarNotes = props.calendarNotes ?? localNotes;
  const setCalendarNotes = props.setCalendarNotes ?? setLocalNotes;

  // Persist hooks
  useEffect(() => {
    localStorage.setItem('sio_calendar_events_v2', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('sio_calendar_notes_v2', JSON.stringify(calendarNotes));
  }, [calendarNotes]);

  // Kanban Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventItem['category']>('folder');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newStatus, setNewStatus] = useState<EventStatus>('created');
  const [newPriority, setNewPriority] = useState<EventPriority>('medium');
  const [newExpiresAt, setNewExpiresAt] = useState(''); // auto-completion timestamp

  // Sub-tab selection inside Events Tab
  const [eventsSubTab, setEventsSubTab] = useState<'incomplete' | 'completed' | 'delayed' | 'cancelled'>('incomplete');

  // Trạng thái bổ sung (completed additions) panel states
  const [isAdditionsExpanded, setIsAdditionsExpanded] = useState(true);
  const [additionsEventId, setAdditionsEventId] = useState('');
  const [additionsText, setAdditionsText] = useState('');
  const [additionsMembers, setAdditionsMembers] = useState<string[]>([]);
  const [additionsFiles, setAdditionsFiles] = useState<string[]>([]);
  const [additionsFileText, setAdditionsFileText] = useState('');

  // Editing Delayed Event states
  const [editingDelayedEvent, setEditingDelayedEvent] = useState<EventItem | null>(null);
  const [delayedNewTime, setDelayedNewTime] = useState('');
  const [delayedNewDuration, setDelayedNewDuration] = useState('');
  const [delayedNewAssignees, setDelayedNewAssignees] = useState<string[]>([]);
  const [delayedNewFiles, setDelayedNewFiles] = useState<string[]>([]);
  const [delayedNewFileText, setDelayedNewFileText] = useState('');

  // Advanced internal document detailed modal state
  const [advancedDocItem, setAdvancedDocItem] = useState<{ type: 'event' | 'note'; id: string } | null>(null);
  const [modalHistoryDetails, setModalHistoryDetails] = useState('');
  const [modalFileText, setModalFileText] = useState('');
  const [modalSelectedAssignee, setModalSelectedAssignee] = useState('');

  // Auto-completion background checker hook
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const updatedEvents = events.map(ev => {
        if (ev.expiresAt && ['created', 'upcoming', 'active'].includes(ev.status)) {
          const expirationDate = new Date(ev.expiresAt);
          if (expirationDate <= now) {
            changed = true;
            const logEntry: DocumentHistoryEntry = {
              id: 'log-sys-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              userName: 'Hệ thống DOCUSYS (Tự động)',
              action: 'Hoàn thành tự động',
              details: `Hết thời gian hiệu lực đã set lúc tạo (${new Date(ev.expiresAt).toLocaleString('vi-VN')}). Sự kiện tự động chuyển sang Đã hoàn thành.`,
              timestamp: new Date().toISOString()
            };
            return {
              ...ev,
              status: 'completed' as const,
              history: ev.history ? [logEntry, ...ev.history] : [logEntry]
            };
          }
        }
        return ev;
      });

      if (changed) {
        setEvents(updatedEvents);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [events, setEvents]);

  const updateDocItem = (updatedFields: Partial<EventItem> & Partial<CalendarNote>) => {
    if (!advancedDocItem) return;
    if (advancedDocItem.type === 'event') {
      const updated = events.map(ev => {
        if (ev.id === advancedDocItem.id) {
          return { ...ev, ...updatedFields };
        }
        return ev;
      });
      setEvents(updated);
    } else {
      const updated = calendarNotes.map(note => {
        if (note.id === advancedDocItem.id) {
          return { ...note, ...updatedFields };
        }
        return note;
      });
      setCalendarNotes(updated);
    }
  };

  const togglePin = (id: string) => {
    setEvents(events.map(ev => ev.id === id ? { ...ev, isPinned: !ev.isPinned } : ev));
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('Xóa sự kiện này?')) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  };

  const getEventIcon = (cat: string) => {
    switch (cat) {
      case 'cinema': return <Film size={14} className="text-pink-500" />;
      case 'group': return <UsersIcon size={14} className="text-blue-500" />;
      case 'person': return <UserIcon size={14} className="text-purple-500" />;
      default: return <FolderOpen size={14} className="text-amber-500" />;
    }
  };

  const getPriorityColor = (priority: EventPriority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityLabel = (priority: EventPriority) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'delayed': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'active': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'upcoming': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'delayed': return 'Bị trì hoãn';
      case 'active': return 'Đang hoạt động';
      case 'upcoming': return 'Sắp diễn ra';
      default: return 'Chưa bắt đầu';
    }
  };

  const updateEventStatus = (id: string, status: EventStatus) => {
    setEvents(events.map(ev => ev.id === id ? { ...ev, status } : ev));
  };

  const getAvatar = (name: string) => {
    if (name.includes('Kim Kim')) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    if (name.includes('Nhất Dược')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    if (name.includes('Hạc Loan')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150';
    if (name.includes('Hân Duyệt')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    if (name.includes('An Na')) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name);
  };

  const sortEvents = (list: EventItem[]) => {
    return list.sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });
  };

  const activeDocItem = advancedDocItem 
    ? (advancedDocItem.type === 'event' 
        ? events.find(e => e.id === advancedDocItem.id) 
        : calendarNotes.find(n => n.id === advancedDocItem.id))
    : null;

  const filteredEvents = events.filter(e => {
    if (eventFilterPriority !== 'all' && e.priority !== eventFilterPriority) return false;
    if (eventFilterCategory !== 'all' && e.category !== eventFilterCategory) return false;
    return true;
  });

  const createdEvents = sortEvents(filteredEvents.filter(e => e.status === 'created'));
  const upcomingEvents = sortEvents(filteredEvents.filter(e => e.status === 'upcoming'));
  const activeEvents = sortEvents(filteredEvents.filter(e => e.status === 'active'));

  const incompleteEvents = sortEvents(filteredEvents.filter(e => e.status === 'created' || e.status === 'upcoming' || e.status === 'active'));
  const completedEvents = sortEvents(filteredEvents.filter(e => e.status === 'completed'));
  const delayedEvents = sortEvents(filteredEvents.filter(e => e.status === 'delayed'));
  const cancelledEvents = sortEvents(filteredEvents.filter(e => e.status === 'cancelled'));

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEv: EventItem = {
      id: 'ev-' + Date.now(),
      category: newCategory,
      title: newTitle,
      time: newTime || 'Hôm nay',
      duration: newDuration || '1 giờ',
      status: newStatus,
      priority: newPriority,
      isPinned: false,
      assignees: [currentUser.name],
      expiresAt: newExpiresAt || undefined,
      history: [
        {
          id: 'log-init-' + Date.now(),
          userName: currentUser.name,
          action: 'Khởi tạo',
          details: `Đã khởi tạo sự kiện: "${newTitle}"`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setEvents([...events, newEv]);
    setNewTitle('');
    setNewTime('');
    setNewDuration('');
    setNewExpiresAt('');
    setIsAdding(false);
  };

  // Calendar calculations
  const monthsVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Generate calendar days for the grid
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1...
    // We want Monday as index 0, Tuesday index 1... Sunday index 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDayIndex = getFirstDayIndex(calendarYear, calendarMonth);

  const prevMonthIndex = calendarMonth === 0 ? 11 : calendarMonth - 1;
  const prevMonthYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonthIndex);

  const gridCells: { dayNum: number; monthOffset: number; dateStr: string }[] = [];

  // Pad previous month's days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const mStr = String(prevMonthIndex + 1).padStart(2, '0');
    gridCells.push({
      dayNum: d,
      monthOffset: -1,
      dateStr: `${prevMonthYear}-${mStr}-${String(d).padStart(2, '0')}`
    });
  }

  // Current month's days
  const mStr = String(calendarMonth + 1).padStart(2, '0');
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push({
      dayNum: d,
      monthOffset: 0,
      dateStr: `${calendarYear}-${mStr}-${String(d).padStart(2, '0')}`
    });
  }

  // Pad next month's days
  const nextMonthIndex = calendarMonth === 11 ? 0 : calendarMonth + 1;
  const nextMonthYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
  const nextMonthMStr = String(nextMonthIndex + 1).padStart(2, '0');
  const remainingCells = 42 - gridCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    gridCells.push({
      dayNum: d,
      monthOffset: 1,
      dateStr: `${nextMonthYear}-${nextMonthMStr}-${String(d).padStart(2, '0')}`
    });
  }

  const handleCellClick = (dateStr: string) => {
    setSelectedNoteDay(dateStr);
    setNoteTitle('');
    setNoteContent('');
    setNotePriority('medium');
    setNoteProgress(0);
    setEditingNote(null);
    setIsAddingNote(true);
  };

  const handleEditNoteClick = (note: CalendarNote, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNote(note);
    setSelectedNoteDay(note.dateStr);
    setNoteTitle(note.title);
    setNoteContent(note.content || '');
    setNoteColor(note.color);
    setNotePriority(note.priority || 'medium');
    setNoteProgress(note.progress ?? 0);
    setIsAddingNote(true);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !selectedNoteDay) return;

    if (editingNote) {
      const updatedNotes = calendarNotes.map(note => {
        if (note.id === editingNote.id) {
          return {
            ...note,
            title: noteTitle,
            content: noteContent,
            color: noteColor,
            priority: notePriority,
            progress: noteProgress,
            isCompleted: noteProgress === 100
          };
        }
        return note;
      });
      setCalendarNotes(updatedNotes);
    } else {
      const newNote: CalendarNote = {
        id: 'note-' + Date.now(),
        dateStr: selectedNoteDay,
        title: noteTitle,
        content: noteContent,
        color: noteColor,
        priority: notePriority,
        progress: noteProgress,
        isCompleted: noteProgress === 100
      };
      setCalendarNotes([...calendarNotes, newNote]);
    }

    setIsAddingNote(false);
    setSelectedNoteDay(null);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteProgress(0);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Xóa ghi chú công việc này?')) {
      setCalendarNotes(calendarNotes.filter(n => n.id !== id));
    }
  };

  const getNoteStyles = (color: string) => {
    switch (color) {
      case 'red': return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'orange': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    }
  };

  const todayStr = (() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const r = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  })();

  const renderEventCard = (event: EventItem) => {
    const isPastExpiration = event.expiresAt ? new Date(event.expiresAt) <= new Date() : false;
    
    return (
      <div 
        key={event.id} 
        onClick={() => setAdvancedDocItem({ type: 'event', id: event.id })}
        className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all flex flex-col relative group/card select-none hover:border-blue-400 hover:shadow-md ${
          event.isPinned ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-[#e2eae8] shadow-sm'
        }`}
      >
        {event.isPinned && (
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-sm z-10">
            <Pin size={12} className="rotate-45" />
          </div>
        )}
        
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getPriorityColor(event.priority)}`}>
              Ưu tiên: {getPriorityLabel(event.priority)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(event.status)}`}>
              {getStatusLabel(event.status)}
            </span>
            {event.isSigned && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-0.5">
                ✒️ Đã ký
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePin(event.id); }} 
              className={`p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors ${event.isPinned ? 'text-blue-600' : ''}`} 
              title={event.isPinned ? 'Bỏ ghim' : 'Ghim sự kiện'}
            >
              {event.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} 
              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
            {getEventIcon(event.category)}
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover/card:text-blue-600 transition-colors">
            {event.title}
          </h3>
        </div>

        {event.expiresAt && (
          <div className={`text-[10px] px-2 py-1 rounded-lg border font-medium mb-3 flex items-center justify-between ${
            isPastExpiration 
              ? 'bg-rose-50 text-rose-700 border-rose-100' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse'
          }`}>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              <span>Hạn tự động:</span>
            </span>
            <span className="font-bold">
              {new Date(event.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.expiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 flex justify-between items-end border-t border-slate-50">
          <div className="flex flex-col space-y-1">
            <div className="text-[10px] text-slate-500 flex items-center space-x-1 font-medium">
              <Clock size={10} />
              <span>{event.time}</span>
            </div>
            <div className="text-[10px] font-mono text-blue-600 font-bold">
              Thời lượng: {event.duration}
            </div>
            {(event.attachments && event.attachments.length > 0) && (
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5 mt-0.5">
                <Paperclip size={10} />
                <span>{event.attachments.length} tệp đính kèm</span>
              </div>
            )}
          </div>
          <div className="flex -space-x-1.5">
            {event.assignees.map((name, i) => (
              <img key={i} src={getAvatar(name)} alt={name} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" title={name} />
            ))}
          </div>
        </div>

        {/* Status Update Quick Actions */}
        <div className="mt-3 pt-2 border-t border-slate-100/70 flex flex-col gap-1.5">
          {event.status === 'delayed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingDelayedEvent(event);
                setDelayedNewTime(event.time);
                setDelayedNewDuration(event.duration);
                setDelayedNewAssignees(event.assignees);
                setDelayedNewFiles(event.attachments || []);
              }}
              className="text-center text-[10px] w-full py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Edit3 size={11} />
              <span>Dời lịch / Đính kèm</span>
            </button>
          )}

          {event.status === 'completed' && event.additions && event.additions.length > 0 && (
            <div className="text-[9.5px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center justify-between">
              <span>Đã có {event.additions.length} báo cáo bổ sung</span>
              <span className="text-[8px] px-1 py-0.2 bg-emerald-200 text-emerald-900 rounded font-mono">Bổ sung</span>
            </div>
          )}

          <div className="flex gap-1 flex-wrap items-center justify-end">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-auto">Cập nhật:</span>
            <div className="flex gap-1 flex-wrap">
              {event.status !== 'completed' && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateEventStatus(event.id, 'completed'); }}
                  className="text-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                >
                  Hoàn thành
                </button>
              )}
              {event.status !== 'delayed' && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateEventStatus(event.id, 'delayed'); }}
                  className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.5 rounded border border-amber-200 transition-colors cursor-pointer"
                >
                  Trì hoãn
                </button>
              )}
              {event.status !== 'cancelled' && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateEventStatus(event.id, 'cancelled'); }}
                  className="text-[9px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded border border-rose-200 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              )}
              {(event.status === 'completed' || event.status === 'cancelled' || event.status === 'delayed') && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateEventStatus(event.id, 'active'); }}
                  className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
                >
                  Khôi phục
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#ebf0f5] min-h-screen p-4 sm:p-6 font-sans text-slate-700">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
            <CalendarIcon size={20} className="text-[#2f80ed]" />
            <span>Lịch & Sự kiện</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Lên kế hoạch, sắp xếp và theo dõi các cột mốc làm việc nội bộ.</p>
        </div>
        
        {/* Tab switchers & Addition buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-slate-200/60 p-1 rounded-xl flex items-center shrink-0">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays size={13} />
              <span>Dạng Lịch</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={13} />
              <span>Sự kiện</span>
            </button>
          </div>

          {activeTab === 'events' && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#2f80ed] hover:bg-[#1c71dd] text-white rounded-xl px-4 py-2 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            >
              <Plus size={13} strokeWidth={3} />
              <span>Thêm sự kiện</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- TAB: CALENDAR GRID ----------------- */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-[#e2eae8] rounded-2xl p-5 shadow-sm">
          {/* Calendar Controller Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-extrabold text-slate-800">
                {monthsVi[calendarMonth]} - {calendarYear}
              </h3>
              <div className="flex bg-slate-50 border border-[#e2eae8] rounded-xl overflow-hidden">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-r border-[#e2eae8]"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Quan trọng</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Cuộc họp</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Kỹ thuật</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full" /> Cá nhân</span>
            </div>
          </div>

          {/* Grid Headers: Monday - Sunday */}
          <div className="grid grid-cols-7 gap-px bg-[#e2eae8] rounded-t-xl overflow-hidden border border-[#e2eae8]">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day, idx) => (
              <div
                key={idx}
                className="bg-slate-50 text-center py-2.5 text-xs font-bold text-slate-500 tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-px bg-[#e2eae8] border-x border-b border-[#e2eae8] rounded-b-xl overflow-hidden">
            {gridCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const isOtherMonth = cell.monthOffset !== 0;
              const notesForDay = calendarNotes.filter(n => n.dateStr === cell.dateStr);

              // Compute birthdays on this cell's date
              const [, cellM, cellD] = cell.dateStr.split('-').map(Number);
              const birthdaysForDay = users.filter(u => {
                if (!u.birthday) return false;
                const [, bm, bd] = u.birthday.split('-').map(Number);
                return bm === cellM && bd === cellD;
              });
              
              const isMyBirthday = birthdaysForDay.some(u => u.id === currentUser.id);
              const otherBirthdays = birthdaysForDay.filter(u => u.id !== currentUser.id);

              return (
                <div
                  key={idx}
                  onClick={() => handleCellClick(cell.dateStr)}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-blue-50/20 relative ${
                    isMyBirthday 
                      ? 'bg-pink-50/60 border border-pink-200'
                      : isToday 
                        ? 'bg-blue-50/10' 
                        : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-extrabold rounded-lg w-6 h-6 flex items-center justify-center transition-all ${
                        isMyBirthday
                          ? 'bg-pink-500 text-white font-black shadow-xs'
                          : isToday
                            ? 'bg-blue-600 text-white font-black shadow-sm'
                            : isOtherMonth
                              ? 'text-slate-300'
                              : 'text-slate-700 group-hover:text-blue-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    
                    {/* Add hover indicators for quick actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(cell.dateStr);
                        }}
                        className="text-[9px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-1 py-0.5 rounded border border-blue-200 transition-all cursor-pointer"
                        title="Thêm ghi chú nhanh"
                      >
                        + Note
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewTime(`12:00 ngày ${cell.dayNum}/${calendarMonth + 1}/${calendarYear}`);
                          setIsAdding(true);
                        }}
                        className="text-[9px] text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200 transition-all cursor-pointer"
                        title="Thêm sự kiện nhanh"
                      >
                        + Sự kiện
                      </button>
                    </div>
                  </div>

                  {/* Notes & Birthdays space */}
                  <div className="flex-1 mt-2 space-y-1.5 overflow-y-auto max-h-[75px] custom-scrollbar">
                    {/* My Birthday Marker */}
                    {isMyBirthday && (
                      <div 
                        className="bg-linear-to-r from-pink-500 to-rose-500 text-white text-[9px] font-extrabold p-1 rounded-lg flex items-center justify-between shadow-xs border border-pink-300 animate-pulse cursor-help"
                        title="Chúc mừng Sinh Nhật của Tôi! 🎂🎈✨"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert("🎉 Chúc mừng Sinh Nhật bạn! DOCUSYS gửi ngàn lời chúc tốt đẹp nhất đến bạn! 🎂🎈🎁");
                        }}
                      >
                        <span className="truncate">🎂 Sinh nhật Tôi 👑</span>
                        <span>✨</span>
                      </div>
                    )}

                    {/* Colleague Birthday Markers */}
                    {otherBirthdays.map(colleague => (
                      <div 
                        key={colleague.id}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[9px] font-bold p-1 rounded-lg flex items-center gap-1 cursor-help"
                        title={`Sinh nhật của đồng nghiệp: ${colleague.name} 🎁`}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`🎂 Hôm nay là sinh nhật của ${colleague.name}! Hãy gửi lời chúc mừng nhé! 🎁`);
                        }}
                      >
                        <span>🎈</span>
                        <span className="truncate">S.Nhật {colleague.name}</span>
                      </div>
                    ))}

                    {notesForDay.map(note => (
                      <div
                        key={note.id}
                        onClick={(e) => handleEditNoteClick(note, e)}
                        className={`text-[9px] font-bold p-1 rounded border flex items-center justify-between tracking-wide transition-all group/note hover:scale-102 ${getNoteStyles(
                          note.color
                        )}`}
                      >
                        <span className="truncate pr-1 leading-snug">{note.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id, e);
                          }}
                          className="opacity-0 group-hover/note:opacity-100 hover:text-red-600 transition-opacity text-[10px] pl-1 font-extrabold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center text-xs text-slate-400 font-medium">
            💡 Nhấp vào ô ngày bất kì trên bảng lịch để nhanh chóng chèn note công việc và gắn nhãn màu sắc! Nhấp đúp hoặc bấm vào note để chỉnh sửa thông tin chi tiết.
          </div>

          {/* Note List Table Section */}
          <div className="mt-8 bg-white border border-[#e2eae8] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <CalendarDays className="text-blue-600 w-4 h-4" />
                  <span>Danh Sách Ghi Chú Công Việc</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Quản lý và theo dõi tiến độ công việc được lưu trên lịch trình.</p>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Tìm ghi chú..." 
                  value={noteSearchTerm}
                  onChange={e => setNoteSearchTerm(e.target.value)}
                  className="px-3 py-1.5 border border-[#e2eae8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-44 text-slate-700"
                />
                <select
                  value={noteFilterPriority}
                  onChange={e => setNoteFilterPriority(e.target.value)}
                  className="px-2 py-1.5 border border-[#e2eae8] rounded-xl text-xs bg-white text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="all">Mọi ưu tiên</option>
                  <option value="high">Ưu tiên Cao</option>
                  <option value="medium">Ưu tiên Trung bình</option>
                  <option value="low">Ưu tiên Thấp</option>
                </select>
                <select
                  value={noteFilterCompleted}
                  onChange={e => setNoteFilterCompleted(e.target.value)}
                  className="px-2 py-1.5 border border-[#e2eae8] rounded-xl text-xs bg-white text-slate-600 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="all">Mọi tiến độ</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="uncompleted">Chưa hoàn thành</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">
                    <th className="py-3 px-3">Ghi chú & Nội dung</th>
                    <th className="py-3 px-3">Ngày thực hiện</th>
                    <th className="py-3 px-3">Độ ưu tiên</th>
                    <th className="py-3 px-3">Tiến độ hoàn thành</th>
                    <th className="py-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-sans">
                  {calendarNotes.filter(note => {
                    const matchesSearch = noteSearchTerm.trim() === '' || 
                      (note.title && note.title.toLowerCase().includes((noteSearchTerm || "").toLowerCase())) || 
                      (note.content && (note.content || "").toLowerCase().includes(noteSearchTerm.toLowerCase())) ||
                      note.dateStr.includes(noteSearchTerm);
                    const matchesPriority = noteFilterPriority === 'all' || note.priority === noteFilterPriority;
                    const matchesCompleted = noteFilterCompleted === 'all' || 
                      (noteFilterCompleted === 'completed' && note.progress === 100) ||
                      (noteFilterCompleted === 'uncompleted' && (note.progress ?? 0) < 100);
                    return matchesSearch && matchesPriority && matchesCompleted;
                  }).map(note => (
                    <tr key={note.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                            note.color === 'blue' ? 'bg-blue-500' :
                            note.color === 'red' ? 'bg-red-500' :
                            note.color === 'green' ? 'bg-emerald-500' :
                            note.color === 'orange' ? 'bg-amber-500' : 'bg-purple-500'
                          }`} />
                          <div className="cursor-pointer group/note" onClick={() => setAdvancedDocItem({ type: 'note', id: note.id })} title="Xem chi tiết">
                            <span className="text-xs font-bold text-slate-800 block group-hover/note:text-blue-600 underline-offset-2 hover:underline transition-colors">{note.title}</span>
                            {note.content && <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{note.content}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 font-semibold font-mono">
                        {note.dateStr}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${getPriorityColor(note.priority || 'medium')}`}>
                          {getPriorityLabel(note.priority || 'medium')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                note.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${note.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-500 font-mono w-8 text-right">
                            {note.progress ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditNoteClick(note)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {calendarNotes.filter(note => {
                    const matchesSearch = noteSearchTerm.trim() === '' || 
                      (note.title && note.title.toLowerCase().includes((noteSearchTerm || "").toLowerCase())) || 
                      (note.content && (note.content || "").toLowerCase().includes(noteSearchTerm.toLowerCase())) ||
                      note.dateStr.includes(noteSearchTerm);
                    const matchesPriority = noteFilterPriority === 'all' || note.priority === noteFilterPriority;
                    const matchesCompleted = noteFilterCompleted === 'all' || 
                      (noteFilterCompleted === 'completed' && note.progress === 100) ||
                      (noteFilterCompleted === 'uncompleted' && (note.progress ?? 0) < 100);
                    return matchesSearch && matchesPriority && matchesCompleted;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                        Không tìm thấy ghi chú nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB: KANBAN EVENTS ----------------- */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-[#e2eae8] rounded-2xl p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mức độ ưu tiên</label>
                <select
                  value={eventFilterPriority}
                  onChange={(e) => setEventFilterPriority(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Danh mục</label>
                <select
                  value={eventFilterCategory}
                  onChange={(e) => setEventFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="work">Công việc</option>
                  <option value="meeting">Cuộc họp</option>
                  <option value="personal">Cá nhân</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="text-right">
                <div className="text-xs text-slate-500 font-semibold">Tổng sự kiện</div>
                <div className="text-lg font-extrabold text-indigo-600">{filteredEvents.length}</div>
              </div>
              <div className="w-px h-8 bg-slate-200 mx-2"></div>
              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Chưa xong', value: incompleteEvents.length, color: '#3b82f6' },
                        { name: 'Hoàn thành', value: completedEvents.length, color: '#10b981' },
                        { name: 'Trì hoãn', value: delayedEvents.length, color: '#f59e0b' },
                        { name: 'Hủy', value: cancelledEvents.length, color: '#f43f5e' },
                      ].filter(d => d.value > 0)}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={25}
                      paddingAngle={2}
                    >
                      {
                        [
                          { name: 'Chưa xong', value: incompleteEvents.length, color: '#3b82f6' },
                          { name: 'Hoàn thành', value: completedEvents.length, color: '#10b981' },
                          { name: 'Trì hoãn', value: delayedEvents.length, color: '#f59e0b' },
                          { name: 'Hủy', value: cancelledEvents.length, color: '#f43f5e' },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sub-tab navigation bar with color-coded badge counters */}
          <div className="bg-white border border-[#e2eae8] rounded-2xl p-2.5 shadow-xs flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setEventsSubTab('incomplete')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                eventsSubTab === 'incomplete'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping" />
              <span>Chưa hoàn thành</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                eventsSubTab === 'incomplete' ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 text-blue-600'
              }`}>{incompleteEvents.length}</span>
            </button>

            <button
              onClick={() => {
                setEventsSubTab('completed');
                // Automatically set additionsEventId if there are completed events
                if (completedEvents.length > 0 && !additionsEventId) {
                  setAdditionsEventId(completedEvents[0].id);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                eventsSubTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Đã hoàn thành</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                eventsSubTab === 'completed' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-600'
              }`}>{completedEvents.length}</span>
            </button>

            <button
              onClick={() => setEventsSubTab('delayed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                eventsSubTab === 'delayed'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Trì hoãn (Delay)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                eventsSubTab === 'delayed' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-600'
              }`}>{delayedEvents.length}</span>
            </button>

            <button
              onClick={() => setEventsSubTab('cancelled')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                eventsSubTab === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Đã hủy</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                eventsSubTab === 'cancelled' ? 'bg-rose-700 text-rose-100' : 'bg-rose-50 text-rose-600'
              }`}>{cancelledEvents.length}</span>
            </button>
          </div>

          {/* SUB-TAB 1: CHƯA HOÀN THÀNH - 3 Cột: Sắp diễn ra, Chưa bắt đầu, Đang hoạt động */}
          {eventsSubTab === 'incomplete' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              
              {/* Column 1.1: Sắp diễn ra */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Sắp diễn ra (Upcoming)</span>
                  </h4>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {incompleteEvents.filter(e => e.status === 'upcoming').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {incompleteEvents.filter(e => e.status === 'upcoming').map(ev => renderEventCard(ev))}
                  {incompleteEvents.filter(e => e.status === 'upcoming').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện sắp diễn ra
                    </div>
                  )}
                </div>
              </div>

              {/* Column 1.2: Chưa bắt đầu */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Chưa bắt đầu (Created)</span>
                  </h4>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {incompleteEvents.filter(e => e.status === 'created').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {incompleteEvents.filter(e => e.status === 'created').map(ev => renderEventCard(ev))}
                  {incompleteEvents.filter(e => e.status === 'created').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện chưa bắt đầu
                    </div>
                  )}
                </div>
              </div>

              {/* Column 1.3: Đang hoạt động */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-spin" />
                    <span>Đang hoạt động (Active)</span>
                  </h4>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {incompleteEvents.filter(e => e.status === 'active').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {incompleteEvents.filter(e => e.status === 'active').map(ev => renderEventCard(ev))}
                  {incompleteEvents.filter(e => e.status === 'active').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện đang diễn ra
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB 2: ĐÃ HOÀN THÀNH - Collapsible supplementary status list + 3 columns by Priority */}
          {eventsSubTab === 'completed' && (
            <div className="space-y-6">
              
              {/* Collapsible Supplementary Status (Trạng thái bổ sung) Row */}
              <div className="bg-white border border-[#e2eae8] rounded-2xl shadow-sm overflow-hidden">
                <div 
                  onClick={() => setIsAdditionsExpanded(!isAdditionsExpanded)}
                  className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex justify-between items-center cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-emerald-600 w-4.5 h-4.5" />
                    <h4 className="text-xs font-extrabold text-slate-800">
                      Mục bổ sung Trạng thái / Kết quả sau hoàn thành ({events.reduce((acc, curr) => acc + (curr.additions?.length || 0), 0)} ghi nhận)
                    </h4>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    {isAdditionsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isAdditionsExpanded && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20">
                    
                    {/* Add supplementary reporting form */}
                    <div className="bg-white border border-[#e2eae8] rounded-xl p-4 shadow-2xs">
                      <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Tạo báo cáo bổ sung</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Chọn sự kiện đã hoàn thành <span className="text-red-500">*</span></label>
                          <select
                            value={additionsEventId}
                            onChange={e => setAdditionsEventId(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          >
                            <option value="">-- Chọn sự kiện để báo cáo --</option>
                            {completedEvents.map(ev => (
                              <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1 font-sans">Nội dung báo cáo chi tiết <span className="text-red-500">*</span></label>
                          <textarea
                            placeholder="Mô tả kết quả thực tế, kết luận kỹ thuật hoặc nhận xét..."
                            value={additionsText}
                            onChange={e => setAdditionsText(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs h-20 outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Thành viên đính kèm liên quan</label>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                            {users.map(u => {
                              const isChecked = additionsMembers.includes(u.name);
                              return (
                                <label key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md cursor-pointer select-none text-[10px] hover:border-emerald-300 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setAdditionsMembers(additionsMembers.filter(m => m !== u.name));
                                      } else {
                                        setAdditionsMembers([...additionsMembers, u.name]);
                                      }
                                    }}
                                    className="rounded text-emerald-600 focus:ring-0 w-3 h-3 cursor-pointer"
                                  />
                                  <span>{u.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Đính kèm file báo cáo kỹ thuật</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Tên tệp (VD: bien_ban_nghiem_thu.pdf)"
                              value={additionsFileText}
                              onChange={e => setAdditionsFileText(e.target.value)}
                              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs flex-1 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (additionsFileText.trim()) {
                                  setAdditionsFiles([...additionsFiles, additionsFileText.trim()]);
                                  setAdditionsFileText('');
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Paperclip size={12} />
                              <span>Đính kèm</span>
                            </button>
                          </div>
                          {additionsFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {additionsFiles.map((f, idx) => (
                                <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
                                  <FileText size={9} />
                                  <span>{f}</span>
                                  <button onClick={() => setAdditionsFiles(additionsFiles.filter((_, i) => i !== idx))} className="text-emerald-600 hover:text-red-500 font-extrabold ml-1">×</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!additionsEventId) {
                              alert('Vui lòng chọn sự kiện đã hoàn thành!');
                              return;
                            }
                            if (!additionsText.trim()) {
                              alert('Vui lòng nhập nội dung báo cáo bổ sung!');
                              return;
                            }

                            const updated = events.map(ev => {
                              if (ev.id === additionsEventId) {
                                const prevAdditions = ev.additions || [];
                                const newAdd: EventAddition = {
                                  id: 'add-' + Date.now(),
                                  text: additionsText,
                                  files: additionsFiles,
                                  members: additionsMembers,
                                  timestamp: new Date().toLocaleString('vi-VN')
                                };
                                const newLog: DocumentHistoryEntry = {
                                  id: 'log-add-' + Date.now(),
                                  userName: currentUser.name,
                                  action: 'Bổ sung trạng thái',
                                  details: `Bổ sung báo cáo: "${additionsText}" (${additionsFiles.length} tệp, ${additionsMembers.length} thành viên)`,
                                  timestamp: new Date().toISOString()
                                };
                                return {
                                  ...ev,
                                  additions: [...prevAdditions, newAdd],
                                  history: ev.history ? [newLog, ...ev.history] : [newLog]
                                };
                              }
                              return ev;
                            });

                            setEvents(updated);
                            setAdditionsText('');
                            setAdditionsFiles([]);
                            setAdditionsMembers([]);
                            setAdditionsFileText('');
                            alert('Bổ sung trạng thái thành công!');
                          }}
                          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send size={12} />
                          <span>Gửi Bổ Sung Trạng Thái</span>
                        </button>
                      </div>
                    </div>

                    {/* Left panel: List view of existing additions */}
                    <div className="bg-white border border-[#e2eae8] rounded-xl p-4 shadow-2xs overflow-y-auto max-h-[380px]">
                      <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Lịch sử bổ sung trạng thái gần đây</h5>
                      <div className="space-y-3.5">
                        {events.filter(e => e.additions && e.additions.length > 0).map(ev => (
                          <div key={ev.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 font-sans">
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded font-mono mb-1.5 inline-block">
                              Sự kiện: {ev.title}
                            </span>
                            <div className="space-y-2 pl-2 border-l-2 border-emerald-500/50">
                              {ev.additions?.map(add => (
                                <div key={add.id} className="text-xs bg-slate-50/55 p-2 rounded-lg">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-slate-400 font-bold">{add.timestamp}</span>
                                    <span className="text-[8px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-extrabold uppercase">Hoàn thiện</span>
                                  </div>
                                  <p className="text-slate-700 font-semibold leading-relaxed text-[11px]">{add.text}</p>
                                  
                                  {add.members.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">Thành viên:</span>
                                      {add.members.map((m, idx) => (
                                        <span key={idx} className="bg-slate-200/80 text-slate-700 font-bold text-[9px] px-1 rounded-sm">{m}</span>
                                      ))}
                                    </div>
                                  )}

                                  {add.files.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase">Tệp:</span>
                                      {add.files.map((f, idx) => (
                                        <a href="#" key={idx} onClick={e => { e.preventDefault(); alert(`Tải xuống tệp: ${f}`); }} className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold">
                                          <Paperclip size={8} />
                                          <span>{f}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {events.filter(e => e.additions && e.additions.length > 0).length === 0 && (
                          <div className="text-center text-slate-400 py-16 text-xs font-semibold">
                            Chưa ghi nhận mục bổ sung trạng thái nào
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* 3 Columns by Priority: Cao, Trung bình, Thấp */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                
                {/* Column 2.1: Cao */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[400px]">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span>Độ ưu tiên: CAO</span>
                    </h4>
                    <span className="bg-red-100 text-red-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                      {completedEvents.filter(e => e.priority === 'high').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {completedEvents.filter(e => e.priority === 'high').map(ev => renderEventCard(ev))}
                    {completedEvents.filter(e => e.priority === 'high').length === 0 && (
                      <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                        Không có sự kiện hoàn thành mức CAO
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2.2: Trung bình */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[400px]">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Độ ưu tiên: TRUNG BÌNH</span>
                    </h4>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                      {completedEvents.filter(e => e.priority === 'medium').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {completedEvents.filter(e => e.priority === 'medium').map(ev => renderEventCard(ev))}
                    {completedEvents.filter(e => e.priority === 'medium').length === 0 && (
                      <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                        Không có sự kiện hoàn thành mức TRUNG BÌNH
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2.3: Thấp */}
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[400px]">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>Độ ưu tiên: THẤP</span>
                    </h4>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                      {completedEvents.filter(e => e.priority === 'low').length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {completedEvents.filter(e => e.priority === 'low').map(ev => renderEventCard(ev))}
                    {completedEvents.filter(e => e.priority === 'low').length === 0 && (
                      <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                        Không có sự kiện hoàn thành mức THẤP
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SUB-TAB 3: TRÌ HOÃN (DELAY) - 3 columns by Priority */}
          {eventsSubTab === 'delayed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              
              {/* Column 3.1: Cao */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Độ ưu tiên: CAO (Hoãn)</span>
                  </h4>
                  <span className="bg-red-100 text-red-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {delayedEvents.filter(e => e.priority === 'high').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {delayedEvents.filter(e => e.priority === 'high').map(ev => renderEventCard(ev))}
                  {delayedEvents.filter(e => e.priority === 'high').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện trì hoãn mức CAO
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3.2: Trung bình */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Độ ưu tiên: TRUNG BÌNH (Hoãn)</span>
                  </h4>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {delayedEvents.filter(e => e.priority === 'medium').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {delayedEvents.filter(e => e.priority === 'medium').map(ev => renderEventCard(ev))}
                  {delayedEvents.filter(e => e.priority === 'medium').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện trì hoãn mức TRUNG BÌNH
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3.3: Thấp */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Độ ưu tiên: THẤP (Hoãn)</span>
                  </h4>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {delayedEvents.filter(e => e.priority === 'low').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {delayedEvents.filter(e => e.priority === 'low').map(ev => renderEventCard(ev))}
                  {delayedEvents.filter(e => e.priority === 'low').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện trì hoãn mức THẤP
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SUB-TAB 4: ĐÃ HỦY - 3 columns by Priority */}
          {eventsSubTab === 'cancelled' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              
              {/* Column 4.1: Cao */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Độ ưu tiên: CAO (Hủy)</span>
                  </h4>
                  <span className="bg-red-100 text-red-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {cancelledEvents.filter(e => e.priority === 'high').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {cancelledEvents.filter(e => e.priority === 'high').map(ev => renderEventCard(ev))}
                  {cancelledEvents.filter(e => e.priority === 'high').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện hủy mức CAO
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4.2: Trung bình */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Độ ưu tiên: TRUNG BÌNH (Hủy)</span>
                  </h4>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {cancelledEvents.filter(e => e.priority === 'medium').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {cancelledEvents.filter(e => e.priority === 'medium').map(ev => renderEventCard(ev))}
                  {cancelledEvents.filter(e => e.priority === 'medium').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện hủy mức TRUNG BÌNH
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4.3: Thấp */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-[#e2eae8] min-h-[500px]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span>Độ ưu tiên: THẤP (Hủy)</span>
                  </h4>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {cancelledEvents.filter(e => e.priority === 'low').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {cancelledEvents.filter(e => e.priority === 'low').map(ev => renderEventCard(ev))}
                  {cancelledEvents.filter(e => e.priority === 'low').length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-10 border-2 border-dashed border-slate-200/60 rounded-xl bg-white/40">
                      Không có sự kiện hủy mức THẤP
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Note Adding Modal */}
      {isAddingNote && selectedNoteDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddingNote(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingNote ? 'Chỉnh sửa Ghi chú' : 'Thêm Ghi chú mới'} ({selectedNoteDay})
              </h3>
              <button onClick={() => setIsAddingNote(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddNoteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tiêu đề ghi chú</label>
                <input
                  required
                  autoFocus
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="VD: Họp giao ban, Nộp báo cáo tuần..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung chi tiết (Không bắt buộc)</label>
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 resize-none"
                  placeholder="Nhập nội dung chi tiết công việc hoặc ghi nhớ quan trọng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={notePriority}
                    onChange={e => setNotePriority(e.target.value as EventPriority)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Màu sắc đánh dấu</label>
                  <div className="flex gap-1.5 h-full items-center">
                    {(['blue', 'red', 'green', 'orange', 'purple'] as const).map(color => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setNoteColor(color)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          color === 'blue' ? 'bg-blue-500' :
                          color === 'red' ? 'bg-red-500' :
                          color === 'green' ? 'bg-emerald-500' :
                          color === 'orange' ? 'bg-amber-500' : 'bg-purple-500'
                        } ${noteColor === color ? 'ring-2 ring-offset-2 ring-blue-500 border-white' : 'border-transparent'}`}
                      >
                        {noteColor === color && <Check size={10} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-600">Tiến độ hoàn thành (%)</label>
                  <span className="text-xs font-mono font-bold text-blue-600">{noteProgress}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={noteProgress}
                    onChange={e => setNoteProgress(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setNoteProgress(0)}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                    >
                      0%
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteProgress(50)}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteProgress(100)}
                      className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                    >
                      100%
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddingNote(false)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Hủy</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Thêm Sự kiện Mới</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddEventSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tiêu đề</label>
                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập tiêu đề sự kiện..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Thời gian (VD: 14:00 Hôm nay)</label>
                  <input required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Thời lượng (VD: 2 giờ)</label>
                  <input required value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as EventStatus)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="created">Đã tạo</option>
                    <option value="upcoming">Chuẩn bị hoạt động</option>
                    <option value="active">Đang hoạt động</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mức độ ưu tiên</label>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value as EventPriority)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phân loại</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="folder">Dự án / Nhiệm vụ</option>
                  <option value="group">Họp nhóm</option>
                  <option value="cinema">Giải trí</option>
                  <option value="person">Cá nhân</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Lưu Sự kiện</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Delayed Event Adjuster Modal */}
      {editingDelayedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingDelayedEvent(null)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden font-sans border border-slate-100 animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                <span>⏳ Điều Chỉnh Sự Kiện Trì Hoãn</span>
              </h3>
              <button onClick={() => setEditingDelayedEvent(null)} className="text-amber-800/60 hover:text-amber-900 font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 leading-relaxed font-semibold">
                Sự kiện: <span className="font-extrabold text-slate-900">"{editingDelayedEvent.title}"</span> đang trì hoãn. Bạn có thể cập nhật thông tin dời lịch dưới đây.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Thời gian mới</label>
                <input 
                  type="text"
                  value={delayedNewTime} 
                  onChange={e => setDelayedNewTime(e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none text-slate-700 font-medium" 
                  placeholder="VD: 15:00 Ngày mai, 18/07"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Thời lượng mới</label>
                <input 
                  type="text"
                  value={delayedNewDuration} 
                  onChange={e => setDelayedNewDuration(e.target.value)} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none text-slate-700 font-medium" 
                  placeholder="VD: 1.5 giờ"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Thành viên tham gia</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                  {users.map(u => {
                    const isChecked = delayedNewAssignees.includes(u.name);
                    return (
                      <label key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md cursor-pointer select-none text-[10px] hover:border-amber-300 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setDelayedNewAssignees(delayedNewAssignees.filter(m => m !== u.name));
                            } else {
                              setDelayedNewAssignees([...delayedNewAssignees, u.name]);
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-0 w-3 h-3 cursor-pointer"
                        />
                        <span className="truncate">{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Đính kèm tài liệu bổ sung</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Tên tệp (VD: bien_ban_hoan_thanh.pdf)"
                    value={delayedNewFileText}
                    onChange={e => setDelayedNewFileText(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs flex-1 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (delayedNewFileText.trim()) {
                        setDelayedNewFiles([...delayedNewFiles, delayedNewFileText.trim()]);
                        setDelayedNewFileText('');
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Paperclip size={12} />
                    <span>Thêm</span>
                  </button>
                </div>
                {delayedNewFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {delayedNewFiles.map((f, idx) => (
                      <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText size={9} />
                        <span>{f}</span>
                        <button onClick={() => setDelayedNewFiles(delayedNewFiles.filter((_, i) => i !== idx))} className="text-amber-600 hover:text-red-500 font-extrabold ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditingDelayedEvent(null)} 
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Hủy
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const updated = events.map(ev => {
                      if (ev.id === editingDelayedEvent.id) {
                        const newLog: DocumentHistoryEntry = {
                          id: 'log-sys-' + Date.now(),
                          userName: currentUser.name,
                          action: 'Điều chỉnh trì hoãn',
                          details: `Cập nhật ngày: "${delayedNewTime}", Thời lượng: "${delayedNewDuration}", Thành viên: [${delayedNewAssignees.join(', ')}], Tài liệu: [${delayedNewFiles.join(', ')}]`,
                          timestamp: new Date().toISOString()
                        };
                        return {
                          ...ev,
                          time: delayedNewTime,
                          duration: delayedNewDuration,
                          assignees: delayedNewAssignees,
                          attachments: delayedNewFiles,
                          history: ev.history ? [newLog, ...ev.history] : [newLog]
                        };
                      }
                      return ev;
                    });
                    setEvents(updated);
                    setEditingDelayedEvent(null);
                    alert('Đã dời lịch sự kiện trì hoãn thành công!');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Cập nhật Thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Document Detailed Modal (Similar to Internal Document Manager with rich logs, digital signature, assignment, attachments) */}
      {advancedDocItem && activeDocItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAdvancedDocItem(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl z-10 overflow-hidden font-sans border border-slate-200 flex flex-col max-h-[90vh] animate-fadeIn">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  {advancedDocItem.type === 'event' ? <CalendarIcon size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] bg-slate-200/80 text-slate-800 font-extrabold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                      {activeDocItem.docNumber || `CV-NBO/2026/${activeDocItem.id.substring(0, 5).toUpperCase()}`}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${getPriorityColor(activeDocItem.priority || 'medium')}`}>
                      {getPriorityLabel(activeDocItem.priority || 'medium')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border bg-slate-100 text-slate-600 border-slate-200">
                      Mức mật: {activeDocItem.confidentiality || 'Bình thường'}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">Thông tin chi tiết {advancedDocItem.type === 'event' ? 'Sự kiện' : 'Ghi chú công việc'}</h3>
                </div>
              </div>
              <button onClick={() => setAdvancedDocItem(null)} className="text-slate-400 hover:text-slate-700 text-lg p-1.5">✕</button>
            </div>

            {/* Split Content layout (scrollable body) */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed font-sans text-xs text-slate-700">
              
              {/* Left Column (Main Information, digital signature, assignees) */}
              <div className="md:col-span-7 space-y-5">
                
                {/* Title & Description card */}
                <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-900">{activeDocItem.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {advancedDocItem.type === 'event' 
                      ? `Lịch trình: ${(activeDocItem as EventItem).time} | Thời lượng: ${(activeDocItem as EventItem).duration}` 
                      : `Ngày ghi nhận: ${(activeDocItem as CalendarNote).dateStr} | Tiến độ: ${(activeDocItem as CalendarNote).progress}%`}
                  </p>
                  <div className="border-t border-slate-100 pt-2 mt-1">
                    <p className="text-xs text-slate-600 whitespace-pre-line font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      {activeDocItem.content || (activeDocItem as EventItem).description || 'Chưa cập nhật mô tả chi tiết cho mục này.'}
                    </p>
                  </div>
                </div>

                {/* Digital Signature section */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Xác thực Chữ ký số nội bộ</h5>
                  {activeDocItem.isSigned ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
                      <div className="text-xl">🛡️</div>
                      <div>
                        <span className="text-[11px] font-extrabold text-emerald-900 block uppercase">Chữ ký số hợp lệ - Đã chứng thực</span>
                        <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                          Tài liệu được ký số cá nhân bởi <span className="font-bold text-slate-900">{activeDocItem.signedBy}</span> vào lúc {activeDocItem.signedAt || new Date().toLocaleString('vi-VN')}.
                        </p>
                        <p className="text-[9px] text-emerald-600 font-mono mt-1">ID Chứng thư: SIO-RSA-4096-SECURE-9921</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                      <p className="text-[10px] text-rose-800 leading-relaxed font-semibold">
                        ⚠️ Công văn / Lịch trình công tác nội bộ này chưa được ký duyệt chính thức. Thành viên có thẩm quyền vui lòng ký số để hoàn thiện văn bản pháp quy.
                      </p>
                      <button
                        onClick={() => {
                          const logEntry: DocumentHistoryEntry = {
                            id: 'log-sys-' + Date.now(),
                            userName: currentUser.name,
                            action: 'Ký số điện tử',
                            details: `Đã hoàn thành thủ tục ký số kiểm duyệt công văn/sự kiện trực tuyến bảo mật.`,
                            timestamp: new Date().toISOString()
                          };
                          const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                          updateDocItem({
                            isSigned: true,
                            signedBy: currentUser.name,
                            signedAt: new Date().toLocaleString('vi-VN'),
                            history: updatedHistory
                          });
                          alert('Ký số điện tử thành công!');
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full shadow-sm"
                      >
                        🖋️ Phê duyệt Chữ ký số của tôi
                      </button>
                    </div>
                  )}
                </div>

                {/* Assignment & Collaborators */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Thành viên tham gia / Chịu trách nhiệm</h5>
                  <div className="flex flex-wrap gap-2 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {(activeDocItem.assignees || []).map((name, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1">
                        <img src={getAvatar(name)} alt={name} className="w-4.5 h-4.5 rounded-full bg-slate-100" />
                        <span className="text-[10px] font-bold text-slate-700">{name}</span>
                        <button
                          onClick={() => {
                            const updated = (activeDocItem.assignees || []).filter(n => n !== name);
                            const logEntry: DocumentHistoryEntry = {
                              id: 'log-sys-' + Date.now(),
                              userName: currentUser.name,
                              action: 'Bỏ chỉ định',
                              details: `Đã gỡ bỏ phân công thành viên: ${name}`,
                              timestamp: new Date().toISOString()
                            };
                            const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                            updateDocItem({
                              assignees: updated,
                              history: updatedHistory
                            });
                          }}
                          className="text-slate-400 hover:text-red-500 font-bold text-xs shrink-0 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {(!activeDocItem.assignees || activeDocItem.assignees.length === 0) && (
                      <span className="text-[11px] text-slate-400 font-medium py-1">Chưa phân công thành viên nào.</span>
                    )}
                  </div>

                  {/* Add assignee picker */}
                  <div className="flex gap-1.5 mt-2">
                    <select
                      value={modalSelectedAssignee}
                      onChange={e => setModalSelectedAssignee(e.target.value)}
                      className="border border-slate-200 rounded-lg p-1.5 text-xs bg-white text-slate-700 outline-none flex-1 font-medium"
                    >
                      <option value="">-- Chọn thành viên để phân công --</option>
                      {users.filter(u => !((activeDocItem.assignees || []).includes(u.name))).map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (modalSelectedAssignee) {
                          const currentAssignees = activeDocItem.assignees || [];
                          if (!currentAssignees.includes(modalSelectedAssignee)) {
                            const updatedAssignees = [...currentAssignees, modalSelectedAssignee];
                            const logEntry: DocumentHistoryEntry = {
                              id: 'log-sys-' + Date.now(),
                              userName: currentUser.name,
                              action: 'Bổ nhiệm nhân sự',
                              details: `Đã giao nhiệm vụ / phân công thêm nhân sự: ${modalSelectedAssignee} tham gia.`,
                              timestamp: new Date().toISOString()
                            };
                            const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                            updateDocItem({
                              assignees: updatedAssignees,
                              history: updatedHistory
                            });
                            setModalSelectedAssignee('');
                          }
                        }
                      }}
                      className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Chỉ định
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column (Attachments and History timeline) */}
              <div className="md:col-span-5 space-y-5 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-5 flex flex-col">
                
                {/* Attachments Section */}
                <div className="space-y-2">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hồ sơ & Tài liệu đính kèm ({ (activeDocItem.attachments || []).length })</h5>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                    {(activeDocItem.attachments || []).map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-2xs font-sans">
                        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <Paperclip size={10} className="text-slate-400" />
                          <span className="truncate max-w-[140px]">{file}</span>
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => alert(`Tải xuống file: ${file}`)}
                            className="text-[9px] text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-extrabold"
                          >
                            Tải về
                          </button>
                          <button
                            onClick={() => {
                              const updated = (activeDocItem.attachments || []).filter((_, i) => i !== idx);
                              const logEntry: DocumentHistoryEntry = {
                                id: 'log-sys-' + Date.now(),
                                userName: currentUser.name,
                                action: 'Gỡ tài liệu',
                                details: `Đã loại bỏ tệp tin đính kèm: "${file}" khỏi văn bản.`,
                                timestamp: new Date().toISOString()
                              };
                              const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                              updateDocItem({
                                attachments: updated,
                                history: updatedHistory
                              });
                            }}
                            className="text-[9px] text-red-600 hover:bg-red-50 px-1 py-0.5 rounded border border-red-100 font-extrabold"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!activeDocItem.attachments || activeDocItem.attachments.length === 0) && (
                      <div className="text-center text-[11px] text-slate-400 py-4 font-semibold">Chưa đính kèm văn bản số hóa nào.</div>
                    )}

                    {/* Add attachment inputs */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Nhập tên tệp đính kèm..."
                        value={modalFileText}
                        onChange={e => setModalFileText(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 outline-none flex-1 font-medium"
                      />
                      <button
                        onClick={() => {
                          if (modalFileText.trim()) {
                            const currentAttachments = activeDocItem.attachments || [];
                            const updatedAttachments = [...currentAttachments, modalFileText.trim()];
                            const logEntry: DocumentHistoryEntry = {
                              id: 'log-sys-' + Date.now(),
                              userName: currentUser.name,
                              action: 'Bổ sung tài liệu',
                              details: `Tải lên tệp đính kèm mới: "${modalFileText.trim()}".`,
                              timestamp: new Date().toISOString()
                            };
                            const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                            updateDocItem({
                              attachments: updatedAttachments,
                              history: updatedHistory
                            });
                            setModalFileText('');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer shrink-0 transition-colors"
                      >
                        Tải lên
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Timeline Activity Log */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                  <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nhật ký xử lý công văn & Hoạt động</h5>
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex-1 flex flex-col min-h-0">
                    <div className="space-y-3.5 overflow-y-auto max-h-48 pr-1 flex-1">
                      {(activeDocItem.history || []).map((entry, idx) => (
                        <div key={entry.id || idx} className="text-[10.5px] leading-relaxed relative pl-4 border-l border-slate-200 pb-3 last:pb-0 font-sans">
                          <div className="absolute left-[-4.5px] top-1 w-2.0 h-2.0 rounded-full bg-blue-500" />
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-0.5">
                            <span className="text-slate-700 font-extrabold">{entry.userName}</span>
                            <span>{new Date(entry.timestamp).toLocaleTimeString('vi-VN')} - {new Date(entry.timestamp).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <span className="font-extrabold text-blue-600 uppercase text-[8px] tracking-wider block mb-0.5">{entry.action}</span>
                          <p className="text-slate-600 font-semibold">{entry.details}</p>
                        </div>
                      ))}
                      {!(activeDocItem.history && activeDocItem.history.length > 0) && (
                        <div className="text-center text-[11px] text-slate-400 py-10 font-semibold">Chưa có nhật ký hoạt động nào.</div>
                      )}
                    </div>

                    {/* Add history message log */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex gap-1.5 shrink-0">
                      <input
                        type="text"
                        placeholder="Nhập ý kiến xử lý của bạn..."
                        value={modalHistoryDetails}
                        onChange={e => setModalHistoryDetails(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-white text-slate-700 outline-none flex-1 font-medium"
                      />
                      <button
                        onClick={() => {
                          if (modalHistoryDetails.trim()) {
                            const logEntry: DocumentHistoryEntry = {
                              id: 'log-user-' + Date.now(),
                              userName: currentUser.name,
                              action: 'Báo cáo / Ý kiến',
                              details: modalHistoryDetails.trim(),
                              timestamp: new Date().toISOString()
                            };
                            const updatedHistory = activeDocItem.history ? [logEntry, ...activeDocItem.history] : [logEntry];
                            updateDocItem({
                              history: updatedHistory
                            });
                            setModalHistoryDetails('');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
