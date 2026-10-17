import React, { useState } from 'react';
import { User } from '../types';
import { 
  Activity,
  LayoutDashboard, 
  FolderKanban, 
  Calendar, 
  PlaneTakeoff, 
  Users, 
  MessageSquare, 
  Cpu, 
  LogOut,
  HelpCircle,
  CheckSquare,
  PenTool,
  Download,
  Upload,
  FileText,
  History,
  Tags,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Settings, FileSignature,
  Layers
} from 'lucide-react';

interface SidebarProps {
  currentUser: User;
  allUsers: User[];
  onUserChange: (user: User) => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
  onLogout: () => void;
  onOpenHelpModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenSettingsModal?: () => void;
  menuOrder?: string[];
  hiddenMenuIds?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  allUsers,
  onUserChange,
  currentTab,
  onTabChange,
  pendingApprovalsCount,
  unreadNotificationsCount,
  onLogout,
  onOpenHelpModal,
  onOpenProfileModal,
  onOpenSettingsModal,
  menuOrder = [],
  hiddenMenuIds = []
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('sidebar_collapsed', String(newValue));
  };

  // Define master list of all menu items
  const ALL_MENU_ITEMS = [
    { id: 'dashboard', label: 'Báo cáo & Lãnh đạo', icon: LayoutDashboard, section: 'main' },
    { id: 'tasks', label: 'Dự án', icon: FolderKanban, section: 'main' },
    { id: 'events', label: 'Lịch & Sự kiện', icon: Calendar, section: 'main' },
    { id: 'user-management', label: 'Nhân sự', icon: Users, section: 'main', roles: ['admin', 'manager'] },
    { id: 'kpi', label: 'Đánh giá nhân viên', icon: Activity, section: 'main' },
    { id: 'chat', label: 'Tin nhắn & Trò chuyện', icon: MessageSquare, section: 'main' },
    { id: 'ocr-manager', label: 'Cổng thông tin & OCR', icon: Cpu, section: 'main' },
    { id: 'approvals', label: 'Phê duyệt đơn từ', icon: CheckSquare, section: 'extended' },
    { id: 'form-builder', label: 'Thiết kế biểu mẫu', icon: PenTool, section: 'extended', roles: ['admin', 'employee'] },
    { id: 'docs-internal', label: 'Công văn nội bộ', icon: FileText, section: 'extended' },
    { id: 'contracts', label: 'Quản lý hợp đồng', icon: FileSignature, section: 'extended', roles: ['admin', 'manager'] },
    { id: 'audit-logs', label: 'Nhật ký hệ thống', icon: History, adminOnly: true, section: 'extended' },
    { id: 'shared-categories', label: 'Danh mục dùng chung', icon: Tags, adminOnly: true, section: 'extended' }
  ];

  // Helper mapping to sort items based on menuOrder custom list
  const getSortedAndFilteredItems = (section: 'main' | 'extended') => {
    // 1. Filter by section
    let items = ALL_MENU_ITEMS.filter(item => item.section === section);

    // 2. Filter by role constraints
    if (currentUser.role !== 'admin') {
      items = items.filter(item => {
        if (item.adminOnly) return false;
        if (item.roles && !item.roles.includes(currentUser.role)) return false;
        return true;
      });
    }

    // 3. Filter by hidden custom settings
    if (hiddenMenuIds.length > 0) {
      items = items.filter(item => !hiddenMenuIds.includes(item.id));
    }

    // 4. Sort by custom order if user reordered
    if (menuOrder.length > 0) {
      const orderMap = new Map(menuOrder.map((id, idx) => [id, idx]));
      items = [...items].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return orderA - orderB;
      });
    }

    return items;
  };

  const mainMenuItems = getSortedAndFilteredItems('main');
  const extendedMenuItems = getSortedAndFilteredItems('extended');

  return (
    <aside className={`${isCollapsed ? 'w-16 md:w-16' : 'w-full md:w-68'} bg-white text-slate-700 flex flex-col h-auto md:h-screen sticky top-0 border-r border-[#e2eae8] z-30 font-sans shadow-sm shrink-0 transition-all duration-300`}>
      {/* App Branding */}
      <div className={`p-4 ${isCollapsed ? 'px-2 justify-center' : 'justify-between'} border-b border-[#e2eae8] flex items-center h-16 shrink-0 overflow-hidden`}>
        {!isCollapsed ? (
          <div className="flex items-center">
            <div className="bg-[#1f4b8e] w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-center">
                <Layers size={20} className="text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#1f4b8e] to-[#0ea5e9]/50"></div>
            </div>
            <div className="overflow-hidden transition-all duration-300 flex flex-col justify-center ml-3 opacity-100">
              <h1 className="text-[13px] font-extrabold tracking-tight text-[#1f4b8e] whitespace-nowrap">DOCUSYS</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">Hệ thống Quản trị & Văn bản</p>
            </div>
          </div>
        ) : null}
        <button 
          onClick={handleToggleCollapse}
          className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : ''}`}
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {mainMenuItems.length > 0 && (
            <div>
              {!isCollapsed ? (
                <span className="block px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2 transition-opacity duration-300">
                  Chức năng chính
                </span>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}
              <nav className="space-y-0.5">
                {mainMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentTab === item.id || (item.id === 'tasks' && currentTab === 'tasks-detail');
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center p-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer relative ${
                        isActive
                          ? 'bg-blue-50 text-[#2f80ed] font-extrabold shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <IconComponent 
                          size={15} 
                          className={`shrink-0 ${isActive ? 'text-[#2f80ed]' : 'text-slate-400 group-hover:text-slate-600'}`} 
                        />
                        <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-44 opacity-100'}`}>
                          <span className="whitespace-nowrap ml-3 tracking-wide">{item.label}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {extendedMenuItems.length > 0 && (
            <div>
              {!isCollapsed ? (
                <span className="block px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2 transition-opacity duration-300">
                  Hệ thống mở rộng
                </span>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}
              <nav className="space-y-0.5">
                {extendedMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = currentTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center p-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer relative ${
                        isActive
                          ? 'bg-blue-50 text-[#2f80ed] font-extrabold shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <IconComponent 
                          size={15} 
                          className={`shrink-0 ${isActive ? 'text-[#2f80ed]' : 'text-slate-400 group-hover:text-slate-600'}`} 
                        />
                        <div className={`overflow-hidden transition-all duration-300 flex items-center ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-44 opacity-100'}`}>
                          <span className="whitespace-nowrap ml-3 tracking-wide">{item.label}</span>
                        </div>
                      </div>
                      {!isCollapsed && item.id === 'approvals' && pendingApprovalsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2f80ed] text-white animate-pulse">
                          {pendingApprovalsCount}
                        </span>
                      )}
                      {isCollapsed && item.id === 'approvals' && pendingApprovalsCount > 0 && (
                        <div className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-[#2f80ed] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Support & Signout Section */}
        <div className="space-y-3 mt-4 pt-4 border-t border-[#e2eae8]">
          {/* Online Support Card with female vector illustration */}
          {!isCollapsed ? (
            <div className="bg-[#f3f7ff] border border-blue-100/50 rounded-xl p-4 text-center relative overflow-hidden transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500">
                  <circle cx="50" cy="40" r="16" fill="#e0ebff" />
                  <path d="M34 40 C34 26, 66 26, 66 40 C66 42, 63 42, 60 40 C57 38, 53 38, 50 40 C47 42, 43 42, 40 40 C37 38, 34 38, 34 40" fill="#2d3748" />
                  <circle cx="50" cy="38" r="11" fill="#fed7d7" />
                  <path d="M42 30 Q50 34 58 30" stroke="#2d3748" strokeWidth="2.5" fill="none" />
                  <circle cx="46" cy="37" r="1" fill="#2d3748" />
                  <circle cx="54" cy="37" r="1" fill="#2d3748" />
                  <path d="M48 42 Q50 44 52 42" stroke="#2d3748" strokeWidth="1" fill="none" />
                  <path d="M30 75 C30 60, 70 60, 70 75 Z" fill="#4299e1" />
                  <path d="M35 75 L65 75 L62 65 L38 65 Z" fill="#cbd5e0" />
                  <path d="M32 75 L68 75 L68 78 L32 78 Z" fill="#a0aec0" />
                  <circle cx="50" cy="70" r="1.5" fill="#ffffff" />
                </svg>
              </div>
              
              <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">Hỗ trợ trực tuyến</p>
              <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Gặp khó khăn? Chuyên gia DOCUSYS sẵn sàng hỗ trợ bạn 24/7.</p>
              
              <button 
                onClick={onOpenHelpModal}
                className="mt-3 w-full bg-[#2f80ed] hover:bg-[#1c71dd] text-white text-[10px] font-extrabold py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <HelpCircle size={12} />
                <span>Hỗ trợ trực tuyến</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenHelpModal}
              title="Hỗ trợ trực tuyến"
              className="w-full flex justify-center py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#2f80ed] transition-all cursor-pointer"
            >
              <HelpCircle size={15} />
            </button>
          )}

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-[#e2eae8]">
            <button
              onClick={onLogout}
              title={isCollapsed ? "Đăng xuất" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'space-x-3 px-3 py-2'} text-xs font-bold text-slate-500 hover:text-rose-600 transition-all cursor-pointer`}
            >
              <LogOut size={15} className="text-slate-400 group-hover:text-rose-500" />
              <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-44 opacity-100 ml-3'}`}>
                <span className="whitespace-nowrap">Đăng xuất</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Profile with profile modal trigger & theme/toolbar settings trigger */}
      <div className={`p-4 ${isCollapsed ? 'px-2 flex-col space-y-3' : 'flex-row'} border-t border-[#e2eae8] bg-[#f8fafc] flex items-center justify-between shrink-0 transition-all duration-300 relative`}>
        <div 
          onClick={onOpenProfileModal}
          className="flex items-center cursor-pointer hover:bg-#e2eae8 p-1.5 rounded-xl min-w-0 group"
          title="Thông tin & Quản lý người dùng"
        >
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover border border-blue-200 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div className={`overflow-hidden transition-all duration-300 flex flex-col justify-center ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-32 opacity-100 ml-2.5'}`}>
            <h4 className="text-[10px] font-extrabold text-slate-800 truncate group-hover:text-blue-600 transition-colors whitespace-nowrap">{currentUser.name}</h4>
            <p className="text-[8px] text-slate-400 truncate font-mono whitespace-nowrap">
              ID: {currentUser.id.toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Settings button in the bottom-right corner of the sidebar menu */}
        <button 
          onClick={onOpenSettingsModal}
          className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shrink-0"
          title="Cài đặt giao diện & thanh công cụ"
        >
          <Settings size={14} className="hover:rotate-45 transition-transform duration-300" />
        </button>
      </div>
    </aside>
  );
};
