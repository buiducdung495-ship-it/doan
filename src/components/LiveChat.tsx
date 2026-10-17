import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatMessage, User, ChatGroup, CloudFile } from '../types';
import { 
  Reply,
  Forward,
  MessageSquare, 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  HelpCircle,
  Building,
  Users,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Smile,
  PlusCircle,
  Plus,
  X,
  FileText,
  FileCheck,
  MoreVertical,
  Check,
  Trash2,
  Eye,
  Download,
  Cloud,
  CloudUpload,
  HardDrive,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  FileDigit,
  FileSignature,
  Video,
  PhoneCall,
  PhoneOff,
  Mic,
  VideoOff,
  MicOff
} from 'lucide-react';
import { QuickPreviewModal } from './QuickPreviewModal';

interface LiveChatProps {
  chatMessages: ChatMessage[];
  currentUser: User;
  allUsers: User[];
  chatGroups?: ChatGroup[];
  onRefreshGroups?: () => void;
  onSendChatMessage: (
    type: 'ai' | 'corporate' | 'department' | 'private', 
    content: string, 
    recipientId?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: 'image' | 'file',
    fileSize?: number,
    replyTo?: { messageId: string, senderName: string, contentSnippet: string }
  ) => Promise<ChatMessage | void>;
  redirectTab?: 'ai' | 'corporate' | 'department' | 'private';
  redirectRecipientId?: string;
  onClearRedirect?: () => void;
  onDeleteChatMessage?: (id: string, mode?: 'me' | 'everyone') => Promise<void>;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  chatMessages,
  currentUser,
  allUsers,
  chatGroups = [],
  onRefreshGroups,
  onSendChatMessage,
  redirectTab,
  redirectRecipientId,
  onClearRedirect,
  onDeleteChatMessage
}) => {
  const [activeChatTab, setActiveChatTab] = useState<'ai' | 'corporate' | 'department' | 'private' | 'cloud'>('ai');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string, senderName: string, contentSnippet: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any | null>(null);
  
  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    name: string;
    type: 'image' | 'file';
    size?: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Uploading and simulation states
  const [uploadingFiles, setUploadingFiles] = useState<any[]>([]);
  const [failedMsgActionId, setFailedMsgActionId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  // Cloud Files Storage States
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const cloudFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Preview State
  const [previewFile, setPreviewFile] = useState<{
    isOpen: boolean;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
  }>({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: 'file'
  });

  // Create Group Modal State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Add Member Modal State (Convert 1-1 to Group)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeVideoCall, setActiveVideoCall] = useState<{ isOpen: boolean, partnerName: string, isGroup: boolean }>({ isOpen: false, partnerName: '', isGroup: false });
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect listener from Notification center clicks
  useEffect(() => {
    if (redirectTab) {
      setActiveChatTab(redirectTab);
    }
    if (redirectRecipientId) {
      setSelectedRecipientId(redirectRecipientId);
    }
    if (redirectTab || redirectRecipientId) {
      onClearRedirect?.();
    }
  }, [redirectTab, redirectRecipientId, onClearRedirect]);

  // File upload progress simulation helper
  const triggerFileSimulation = (newFile: any) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 12; // 12-27% increments
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        // 30% chance to simulate network packet loss/connection error
        const isError = Math.random() < 0.3;
        if (isError) {
          setUploadingFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, progress: 100, status: 'failed' } : f));
        } else {
          // Success! Send to real database via onSendChatMessage
          onSendChatMessage(
            newFile.activeChatTab,
            newFile.content,
            newFile.recipientId,
            newFile.fileUrl,
            newFile.fileName,
            newFile.fileType,
            newFile.fileSize,
            newFile.replyTo
          ).then(() => {
            // Remove from local in-progress upload state
            setUploadingFiles(prev => prev.filter(f => f.id !== newFile.id));
          }).catch(err => {
            console.error('File send error:', err);
            setUploadingFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, status: 'failed' } : f));
          });
        }
      } else {
        setUploadingFiles(prev => prev.map(f => f.id === newFile.id ? { ...f, progress: currentProgress } : f));
      }
    }, 350);
  };

  const handleRetryUpload = (id: string) => {
    setFailedMsgActionId(null);
    const found = uploadingFiles.find(f => f.id === id);
    if (!found) return;

    // Set status back to uploading and progress back to 0
    setUploadingFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'uploading', progress: 0 } : f));
    
    // Re-run simulation
    triggerFileSimulation({ ...found, status: 'uploading', progress: 0 });
  };

  const handleDeleteUpload = (id: string) => {
    setFailedMsgActionId(null);
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  // Departments List
  const departments = useMemo(() => {
    const deps = new Set(allUsers.map(u => u.department));
    return Array.from(deps);
  }, [allUsers]);

  // Filter department members (exclude Admins and CEOs/Giám đốc)
  const departmentMembers = useMemo(() => {
    if (!selectedRecipientId) return [];
    return allUsers.filter(u => {
      if (u.department !== selectedRecipientId) return false;
      
      const roleLower = (u.role || "").toLowerCase();
      const posLower = (u.position || '').toLowerCase();
      
      const isHighLevel = roleLower === 'admin' || 
                          roleLower === 'ceo' || 
                          roleLower === 'manager' && posLower.includes('giám đốc') || 
                          posLower.includes('ceo') || 
                          posLower.includes('sếp') || 
                          posLower.includes('admin') || 
                          posLower.includes('giám đốc') ||
                          posLower.includes('chủ tịch');
                          
      return !isHighLevel;
    });
  }, [allUsers, selectedRecipientId]);

  // Set default recipient when switching tabs
  useEffect(() => {
    if (activeChatTab === 'department') {
      setSelectedRecipientId(currentUser.department);
    } else if (activeChatTab === 'private') {
      // Find either first other user or first group
      const firstOtherUser = allUsers.find(u => u.id !== currentUser.id);
      setSelectedRecipientId(firstOtherUser?.id || '');
    } else {
      setSelectedRecipientId('');
    }
    setAttachedFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatTab]);

  // Filter messages based on tab selection
  const activeMessages = useMemo(() => {
    if (activeChatTab === 'ai') {
      return chatMessages.filter(m => m.recipientId === 'ai-bot' || m.senderId === 'ai-bot');
    }
    if (activeChatTab === 'corporate') {
      return chatMessages.filter(m => m.recipientId === 'all');
    }
    if (activeChatTab === 'department') {
      return chatMessages.filter(m => m.recipientId === `dept:${selectedRecipientId}`);
    }
    if (activeChatTab === 'private') {
      // Check if recipient is a group
      if (selectedRecipientId.startsWith('group:')) {
        return chatMessages.filter(m => m.recipientId === selectedRecipientId);
      }
      // Or standard 1-1 chat
      return chatMessages.filter(m => 
        (m.senderId === currentUser.id && m.recipientId === selectedRecipientId) ||
        (m.senderId === selectedRecipientId && m.recipientId === currentUser.id)
      );
    }
    return [];
  }, [chatMessages, activeChatTab, selectedRecipientId, currentUser.id]);

  // Merge standard messages with local simulated in-progress uploads
  const displayedMessages = useMemo(() => {
    const currentRecipient = selectedRecipientId;
    const currentTab = activeChatTab;

    const currentUploads = uploadingFiles.filter(f => {
      if (currentTab === 'corporate') {
        return f.recipientId === 'all';
      }
      if (currentTab === 'department') {
        return f.recipientId === `dept:${currentRecipient}`;
      }
      if (currentTab === 'private') {
        return f.recipientId === currentRecipient;
      }
      return false;
    });

    return [...activeMessages, ...currentUploads];
  }, [activeMessages, uploadingFiles, activeChatTab, selectedRecipientId]);

  // Load cloud storage files from the API server
  const fetchCloudFiles = async () => {
    try {
      setIsCloudLoading(true);
      const res = await fetch(`/api/cloud-files?userId=${currentUser.id}`);
      if (res.ok) {
        const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
        setCloudFiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch cloud files:', err);
    } finally {
      setIsCloudLoading(false);
    }
  };

  useEffect(() => {
    if (activeChatTab === 'cloud') {
      fetchCloudFiles();
    }
  }, [activeChatTab, currentUser.id]);

  // Handle local file uploads (converts to base64 for beautiful instant visual feedback!)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Tệp quá lớn (Tối đa 50MB để đảm bảo hiệu suất hoạt động).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachedFile({
          url: event.target.result as string,
          name: file.name,
          type: type,
          size: file.size
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    const content = input;
    const filePayload = attachedFile;
    const currentReply = replyingTo;
    
    setInput('');
    setAttachedFile(null);
    setReplyingTo(null);

    const destTab = activeChatTab === 'cloud' ? 'corporate' : activeChatTab;
    const destRecipient = selectedRecipientId;

    if (filePayload) {
      // Simulated upload for file sending!
      const localId = 'upload-' + Date.now().toString() + Math.random().toString(36).substring(2, 5);
      const newUpload = {
        id: localId,
        isLocalUploading: true,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        senderRole: currentUser.role,
        recipientId: destTab === 'department' ? `dept:${destRecipient}` : destRecipient,
        activeChatTab: destTab,
        content: content,
        fileName: filePayload.name,
        fileUrl: filePayload.url,
        fileType: filePayload.type,
        fileSize: filePayload.size || 0,
        progress: 0,
        status: 'uploading',
        timestamp: new Date().toISOString(),
        replyTo: currentReply || undefined
      };

      setUploadingFiles(prev => [...prev, newUpload]);
      triggerFileSimulation(newUpload);
    } else {
      // Normal message send
      setIsSending(true);
      try {
        await onSendChatMessage(
          destTab, // type
          content, // text
          destRecipient, 
          undefined, 
          undefined, 
          undefined,
          undefined,
          currentReply || undefined
        );
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Không thể gửi tin nhắn.');
      } finally {
        setIsSending(false);
      }
    }
  };

  // Cloud Page Upload action
  const handleCloudUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Tệp quá lớn (Tối đa 50MB để đảm bảo hiệu suất hoạt động).');
      return;
    }

    const currentUsed = currentUser.cloudUsed || 0;
    const MAX_QUOTA = 2 * 1024 * 1024 * 1024; // 2GB
    if (currentUsed + file.size > MAX_QUOTA) {
      alert('Không đủ dung lượng lưu trữ đám mây. Dung lượng giới hạn là 2GB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        try {
          const res = await fetch('/api/cloud-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              fileName: file.name,
              fileUrl: event.target.result as string,
              fileType: file.type.startsWith('image/') ? 'image' : 'file',
              fileSize: file.size
            })
          });

          if (res.ok) {
            fetchCloudFiles();
            if (onRefreshGroups) onRefreshGroups(); // trigger UI-wide storage update
          } else {
            const text_errData = await res.text(); let errData: any = {}; if (text_errData) { try { errData = JSON.parse(text_errData); } catch(e) { console.error("JSON parse error:", text_errData); errData = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
            alert(errData.error || 'Tải lên đám mây thất bại.');
          }
        } catch (err) {
          console.error(err);
          alert('Lỗi khi lưu trữ file vào Cloud.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Cloud Page Delete action
  const handleDeleteCloudFile = async (fileId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tệp tin này để giải phóng bộ nhớ lưu trữ đám mây?')) return;
    try {
      const res = await fetch(`/api/cloud-files/${fileId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCloudFiles();
        if (onRefreshGroups) onRefreshGroups();
      } else {
        alert('Xóa file không thành công.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Emojis list
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌',
    '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🧐', '😎', '🥳', '😏', '😔', '🥺', '😢',
    '😭', '😤', '😠', '😡', '🤬', '😱', '🥱', '😴', '💩', '👻', '👍', '👎', '✊', '👊',
    '✌️', '🤞', '🤟', '👏', '🙌', '🙏', '❤️', '🔥', '🌟', '🎉', '💡', '📌', '💻', '💼'
  ];

  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  // Create Group Submit
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) return;

    const allMembers = [currentUser.id, ...selectedGroupMembers];

    try {
      const res = await fetch('/api/chats/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          memberIds: allMembers
        })
      });
      const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      if (onRefreshGroups) onRefreshGroups();
      
      // Auto switch to newly created group
      setSelectedRecipientId(`group:${data.id}`);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setSelectedGroupMembers([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Member to active 1-1 to convert to a Group
  const handleAddMemberToCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.length === 0) return;

    // Active 1-1 user plus other selected members
    const allMembers = [currentUser.id, selectedRecipientId, ...selectedGroupMembers];

    try {
      const res = await fetch('/api/chats/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          memberIds: allMembers
        })
      });
      const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      if (onRefreshGroups) onRefreshGroups();
      
      // Switch active chat to group
      setSelectedRecipientId(`group:${data.id}`);
      setShowAddMemberModal(false);
      setNewGroupName('');
      setSelectedGroupMembers([]);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGroupMemberSelection = (userId: string) => {
    setSelectedGroupMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Find users and groups for private/group lists
  const availableUsers = useMemo(() => {
    return allUsers.filter(u => u.id !== currentUser.id);
  }, [allUsers, currentUser.id]);

  const availableGroups = useMemo(() => {
    // Show groups that currentUser belongs to
    return chatGroups.filter(g => g.memberIds.includes(currentUser.id));
  }, [chatGroups, currentUser.id]);

  const activeChatPartnerName = useMemo(() => {
    if (selectedRecipientId.startsWith('group:')) {
      const gId = selectedRecipientId.replace('group:', '');
      const group = chatGroups.find(g => g.id === gId);
      return group ? `Nhóm: ${group.name}` : 'Nhóm trò chuyện';
    }
    const user = allUsers.find(u => u.id === selectedRecipientId);
    return user ? `Trò chuyện với: ${user.name}` : 'Trò chuyện riêng tư';
  }, [selectedRecipientId, chatGroups, allUsers]);

  const sampleQuestions = [
    'Mức khấu hao bán thanh lý máy tính cũ được tính như thế nào?',
    'Quy chế xin nghỉ phép hành chính duyệt tự động ra sao?',
    'Làm sao để đăng ký đổi máy tính RAM 8GB sang 16GB?',
    'Lương cơ bản của tôi bị trừ bao nhiêu nếu mua máy trả góp?'
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="chat-hub-view">
      {/* Sidebar Navigation */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 px-2">Danh mục Kênh</h3>
          <div className="space-y-2">
            
            {/* Tab 1: AI Assistant */}
            <button
              onClick={() => {
                setActiveChatTab('ai');
                
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeChatTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
              }`}
            >
              <Bot size={18} className={activeChatTab === 'ai' ? 'text-white' : 'text-indigo-600'} />
              <div>
                <h4 className="text-xs font-bold">Trợ Lý AI HR</h4>
                <p className={`text-[10px] mt-0.5 ${activeChatTab === 'ai' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Hỏi đáp chính sách công ty bằng Gemini
                </p>
              </div>
            </button>

            {/* Tab 2: Corporate Chat */}
            <button
              onClick={() => {
                setActiveChatTab('corporate');
                
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeChatTab === 'corporate'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
              }`}
            >
              <Building size={18} className={activeChatTab === 'corporate' ? 'text-white' : 'text-blue-600'} />
              <div>
                <h4 className="text-xs font-bold">Kênh Doanh Nghiệp (All)</h4>
                <p className={`text-[10px] mt-0.5 ${activeChatTab === 'corporate' ? 'text-blue-200' : 'text-slate-400'}`}>
                  Chat chung trao đổi nội bộ nhân sự
                </p>
              </div>
            </button>

            {/* Tab 3: Department Chat */}
            <button
              onClick={() => {
                setActiveChatTab('department');
                
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeChatTab === 'department'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
              }`}
            >
              <Users size={18} className={activeChatTab === 'department' ? 'text-white' : 'text-emerald-600'} />
              <div>
                <h4 className="text-xs font-bold">Phòng ban</h4>
                <p className={`text-[10px] mt-0.5 ${activeChatTab === 'department' ? 'text-emerald-200' : 'text-slate-400'}`}>
                  Trao đổi trong phòng ban
                </p>
              </div>
            </button>

            {/* Tab 4: Private & Group Chat */}
            <button
              onClick={() => {
                setActiveChatTab('private');
                
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeChatTab === 'private'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
              }`}
            >
              <UserIcon size={18} className={activeChatTab === 'private' ? 'text-white' : 'text-rose-600'} />
              <div>
                <h4 className="text-xs font-bold">Cá nhân & Nhóm</h4>
                <p className={`text-[10px] mt-0.5 ${activeChatTab === 'private' ? 'text-rose-200' : 'text-slate-400'}`}>
                  Nhắn tin riêng tư và nhóm chat
                </p>
              </div>
            </button>

            {/* Tab 5: Cloud Storage */}
            <button
              onClick={() => {
                setActiveChatTab('cloud');
                
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all cursor-pointer ${
                activeChatTab === 'cloud'
                  ? 'bg-indigo-700 text-white shadow-sm shadow-indigo-700/10'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
              }`}
            >
              <Cloud size={18} className={activeChatTab === 'cloud' ? 'text-white' : 'text-indigo-600'} />
              <div className="truncate text-left">
                <h4 className="text-xs font-bold">Cloud Cá Nhân (2GB)</h4>
                <p className={`text-[10px] mt-0.5 truncate ${activeChatTab === 'cloud' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {((currentUser.cloudUsed || 0) / (1024 * 1024)).toFixed(1)} MB / 2048 MB dùng
                </p>
              </div>
            </button>

          </div>
        </div>

        {/* Dynamic Selection Area depending on tab */}
        {activeChatTab === 'department' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-4">
             <div className="space-y-1.5">
               <h3 className="font-extrabold text-slate-800 text-sm px-2">Chọn Phòng ban</h3>
               <select 
                 className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700 bg-slate-50 cursor-pointer"
                 value={selectedRecipientId}
                 onChange={(e) => setSelectedRecipientId(e.target.value)}
               >
                 {departments.map(d => (
                   <option key={d} value={d}>{d}</option>
                 ))}
               </select>
             </div>

             {/* Member list display */}
             <div className="pt-2 border-t border-slate-100">
               <div className="flex justify-between items-center mb-2 px-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                   Thành viên ({departmentMembers.length})
                 </span>
                 <span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold border border-emerald-100">
                   Đang ẩn sếp/admin
                 </span>
               </div>

               {departmentMembers.length === 0 ? (
                 <p className="text-[10px] text-slate-400 italic text-center py-4">Không có thành viên phụ thuộc.</p>
               ) : (
                 <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                   {departmentMembers.map(member => (
                     <div key={member.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                       <img 
                         src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                         alt={member.name} 
                         className="w-6 h-6 rounded-full object-cover border border-slate-200"
                         referrerPolicy="no-referrer"
                       />
                       <div className="min-w-0 flex-1 text-left">
                         <div className="text-[10.5px] font-bold text-slate-700 truncate">{member.name}</div>
                         <div className="text-[8.5px] text-slate-400 truncate font-mono uppercase">{member.position || member.role}</div>
                       </div>
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        )}

        {activeChatTab === 'private' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-extrabold text-slate-800 text-sm">Trò chuyện</h3>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 px-2 py-1 rounded-lg transition-all"
              >
                <PlusCircle size={12} />
                Tạo nhóm
              </button>
            </div>

            {/* Combined custom select list for Groups and Private DMs */}
            <div className="space-y-3">
              {/* Groups Sub-list */}
              {availableGroups.length > 0 && (
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">Nhóm chat ({availableGroups.length})</span>
                  <div className="space-y-0.5">
                    {availableGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedRecipientId(`group:${g.id}`);
                          
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                          selectedRecipientId === `group:${g.id}`
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">👥 {g.name}</span>
                        <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.2 rounded font-mono">{g.memberIds.length} TV</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individuals Sub-list */}
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">Thành viên ({availableUsers.length})</span>
                <div className="space-y-0.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedRecipientId(u.id);
                        
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                        selectedRecipientId === u.id
                          ? 'bg-rose-50 text-rose-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-5 h-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <span className="truncate">{u.name} <span className="font-normal text-slate-400">({u.role})</span></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Quick Links for AI Tab */}
        {activeChatTab === 'ai' && (
          <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100/50 space-y-3">
            <h4 className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              Gợi ý câu hỏi nhanh:
            </h4>
            <div className="space-y-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-[11px] text-indigo-950 font-medium bg-white hover:bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg transition-colors leading-relaxed cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Conversation Screen (Right Column) */}
      <div className="col-span-12 lg:col-span-8">
        {activeChatTab === 'cloud' ? (
          /* Cloud Storage Dashboard */
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[calc(100vh-12rem)] min-h-[500px] flex flex-col overflow-hidden text-left" id="cloud-storage-container">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Cloud size={16} className="text-indigo-600" />
                  Kho Lưu Trữ Đám Mây Nhân Sự (DOCUSYS Cloud)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Lưu trữ tệp tin riêng tư bảo mật lên tới 2GB dung lượng</p>
              </div>
              <div className="flex items-center space-x-2">
                
                <button
                  onClick={() => cloudFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <CloudUpload size={13} />
                  Tải tệp mới lên
                </button>
                <input 
                  type="file"
                  ref={cloudFileInputRef}
                  className="hidden"
                  onChange={handleCloudUpload}
                />
              </div>
            </div>

            {/* Storage usage meter card */}
            <div className="p-4 bg-slate-50/30 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="w-full sm:w-2/3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                  <span>Dung lượng đã sử dụng</span>
                  <span className="font-mono text-indigo-600">
                    {((currentUser.cloudUsed || 0) / (1024 * 1024)).toFixed(1)} MB / 2048 MB (
                    {(((currentUser.cloudUsed || 0) / (2 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      ((currentUser.cloudUsed || 0) / (2 * 1024 * 1024 * 1024)) > 0.9 ? 'bg-rose-500' :
                      ((currentUser.cloudUsed || 0) / (2 * 1024 * 1024 * 1024)) > 0.7 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (((currentUser.cloudUsed || 0) / (2 * 1024 * 1024 * 1024)) * 100))}%` }}
                  />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-left sm:text-right sm:w-1/3 leading-normal">
                <p className="font-bold text-slate-500">💡 Mẹo tối ưu bộ nhớ:</p>
                <p>Xóa tệp tin cũ hoặc không cần thiết để giải phóng dung lượng đám mây tức thời.</p>
              </div>
            </div>

            {/* Cloud Files list or loading indicator */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isCloudLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold">Đang tải tài liệu đám mây...</p>
                </div>
              ) : cloudFiles.length === 0 ? (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6">
                  <HardDrive size={32} className="text-slate-300 mb-2 stroke-1" />
                  <p className="text-xs font-bold">Không gian trống rỗng</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Tài khoản của bạn chưa có tệp tin lưu trữ nào trên đám mây. Hãy nhấn "Tải tệp mới lên" hoặc gửi file trong các kênh chat để tự động lưu trữ tại đây.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  {cloudFiles.map(file => {
                    const ext = file.fileName.split('.').pop()?.toLowerCase() || '';
                    const isImg = file.fileType === 'image' || ['png','jpg','jpeg','gif','webp','svg'].includes(ext);
                    
                    return (
                      <div key={file.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-xs transition-all flex items-center justify-between group text-left">
                        <div className="flex items-center space-x-3 truncate">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                            {isImg ? <ImageIcon size={16} /> : <FileText size={16} />}
                          </div>
                          <div className="truncate text-left">
                            <p className="text-xs font-extrabold text-slate-700 truncate" title={file.fileName}>{file.fileName}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold font-mono">
                              {ext} • {((file.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                          {/* Quick View */}
                          <button
                            onClick={() => setPreviewFile({
                              isOpen: true,
                              fileName: file.fileName,
                              fileUrl: file.fileUrl,
                              fileType: file.fileType,
                              fileSize: file.fileSize
                            })}
                            className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Xem nhanh trên web"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Download */}
                          <a
                            href={file.fileUrl}
                            download={file.fileName}
                            className="p-1.5 hover:bg-slate-100 hover:text-blue-600 text-slate-400 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Tải về máy"
                          >
                            <Download size={13} />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCloudFile(file.id)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Xóa tệp giải phóng bộ nhớ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[calc(100vh-12rem)] min-h-[500px] flex flex-col justify-between overflow-hidden">
            
            {/* Active Header */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2.5 text-left">
                
              <div className={`p-2 rounded-lg ${
                activeChatTab === 'ai' ? 'bg-indigo-100 text-indigo-600' :
                activeChatTab === 'corporate' ? 'bg-blue-100 text-blue-600' :
                activeChatTab === 'department' ? 'bg-emerald-100 text-emerald-600' :
                'bg-rose-100 text-rose-600'
              }`}>
                {activeChatTab === 'ai' ? <Bot size={18} /> : 
                 activeChatTab === 'corporate' ? <Building size={18} /> : 
                 activeChatTab === 'department' ? <Users size={18} /> : 
                 <UserIcon size={18} />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {activeChatTab === 'ai' ? 'Trợ Lý Nội Quy Thông Minh (AI HR Bot)' : 
                   activeChatTab === 'corporate' ? 'Kênh Đàm Thoại Chung Toàn Công Ty' :
                   activeChatTab === 'department' ? `Phòng ban: ${selectedRecipientId}` :
                   activeChatPartnerName}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {activeChatTab === 'ai' ? 'Giải đáp chính xác quy chế, máy móc thiết bị, mua thanh lý bằng LLM' : 
                   activeChatTab === 'corporate' ? 'Kênh chat tổng nội bộ giữa mọi nhân sự công ty' :
                   activeChatTab === 'department' ? 'Kênh chat chung nội bộ của phòng ban' :
                   selectedRecipientId.startsWith('group:') ? 'Kênh trao đổi nhóm bảo mật' : 'Cuộc trò chuyện riêng tư 1-1'}
                </p>
              </div>
            </div>

            {/* Right side controls (FaceTime and Add member) */}
            <div className="flex items-center space-x-2">
              {['private', 'department'].includes(activeChatTab) && selectedRecipientId !== '' && (
                <button
                  onClick={() => {
                    setActiveVideoCall({ isOpen: true, partnerName: activeChatPartnerName, isGroup: selectedRecipientId.startsWith('group:') || activeChatTab === 'department' });
                  }}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Gọi Video Meeting (FaceTime)"
                >
                  <Video size={12} strokeWidth={2.5} />
                  <span>FaceTime</span>
                </button>
              )}
              {activeChatTab === 'private' && !selectedRecipientId.startsWith('group:') && selectedRecipientId !== '' && (
                <button
                  onClick={() => {
                    setNewGroupName(`${currentUser.name.split(' ').pop()} & ${allUsers.find(u => u.id === selectedRecipientId)?.name.split(' ').pop()} Group`);
                    setSelectedGroupMembers([]);
                    setShowAddMemberModal(true);
                  }}
                  className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="Thêm thành viên để lập nhóm"
                >
                  <Plus size={12} strokeWidth={3} />
                  <span>Lập nhóm</span>
                </button>
              )}

              {activeChatTab === 'ai' && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-full font-mono uppercase">
                  <ShieldCheck size={11} />
                  Bảo mật
                </span>
              )}
              
            </div>
          </div>

          {/* Conversation Messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 flex flex-col justify-end">
            <div className="space-y-3 overflow-y-auto h-full flex flex-col-reverse">
              {/* If no messages, render welcome */}
              {activeMessages.length === 0 && (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center h-full justify-center">
                  <HelpCircle size={32} className="text-slate-300 stroke-1 mb-2 animate-pulse" />
                  <p className="text-xs font-bold">Chưa có tin nhắn nào.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Nhập câu hỏi hoặc lời chào ở khung dưới để trò chuyện ngay.</p>
                </div>
              )}

              {/* Render in reverse because flex-col-reverse naturally places newest at bottom with smooth scroll anchoring! */}
              {[...displayedMessages].reverse().map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isSystemBot = msg.senderId === 'ai-bot';
                const isLocal = msg.isLocalUploading;
                const isFailed = isLocal && msg.status === 'failed';
                
                let bubbleColor = 'bg-slate-600 text-white shadow-3xs';
                if (isLocal) {
                  bubbleColor = isFailed ? 'bg-rose-50 border border-rose-200 text-rose-950' : 'bg-slate-50 border border-slate-200/40 text-slate-700';
                } else if (isMe) {
                  bubbleColor = activeChatTab === 'ai' ? 'bg-indigo-600 text-white' :
                                activeChatTab === 'corporate' ? 'bg-blue-600 text-white' :
                                activeChatTab === 'department' ? 'bg-emerald-600 text-white' :
                                'bg-rose-600 text-white';
                } else if (isSystemBot) {
                  bubbleColor = 'bg-white text-indigo-950 border border-indigo-100 font-medium shadow-3xs';
                } else {
                  bubbleColor = 'bg-white text-slate-800 border border-slate-100 shadow-3xs';
                }

                // Check for official document tag
                const isOfficial = msg.content && msg.content.includes('📄 [VĂN BẢN CHÍNH THỨC]');
                const cleanContent = isOfficial ? msg.content.replace('📄 [VĂN BẢN CHÍNH THỨC]\n', '') : msg.content;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-[85%] mt-3 ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0">
                      {isSystemBot ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                          <Bot size={15} />
                        </div>
                      ) : (
                        <img
                          src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 bg-white"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Content Box */}
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-bold text-slate-600">{isSystemBot ? 'Trợ Lý AI HR' : msg.senderName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Message Bubble itself */}
                        <div className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap flex-1 ${bubbleColor} ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'} relative group/msg ${isLocal && !isFailed ? 'opacity-65' : ''}`}>
                          {msg.replyTo && (
                            <div className="mb-2 p-1.5 bg-black/10 border-l-2 border-black/20 rounded text-[10px] text-left overflow-hidden">
                              <strong className="opacity-70 block mb-0.5">{msg.replyTo.senderName}</strong>
                              <span className="opacity-60 truncate block">{msg.replyTo.contentSnippet}</span>
                            </div>
                          )}
                          
                          {/* Official Doc look vs Clean message rendering */}
                          {isOfficial ? (
                            <div className="bg-[#fdfbf7] border-2 border-red-700 text-red-950 rounded-xl p-4 shadow-lg space-y-3 font-serif relative overflow-hidden max-w-md my-1">
                              {/* Red header ribbon */}
                              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-700" />
                              
                              <div className="text-center space-y-0.5 border-b border-red-100 pb-2">
                                <h5 className="text-[9px] font-extrabold uppercase tracking-widest text-red-800">CÔNG VĂN NỘI BỘ CHÍNH THỨC</h5>
                                <div className="text-[7.5px] italic text-slate-500">Doanh nghiệp HR Tech - Độc lập - Tự do</div>
                                <div className="h-0.5 w-16 bg-red-700 mx-auto mt-1" />
                              </div>

                              <div className="text-xs leading-relaxed font-sans text-slate-800 whitespace-pre-wrap py-1">
                                {cleanContent}
                              </div>

                              <div className="flex justify-end items-center pt-2 border-t border-red-100">
                                <div className="text-right space-y-1 relative pr-1.5">
                                  <div className="text-[9px] font-extrabold uppercase text-red-800">GIÁM ĐỐC / ADMIN</div>
                                  <div className="text-[8px] text-slate-400 font-mono">Đã đóng dấu số</div>
                                  
                                  {/* Stamp seal circle */}
                                  <div className="absolute -top-4 -left-14 border-2 border-double border-red-500 text-red-500 bg-red-50/70 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded rotate-[-12deg] inline-block shadow-xs">
                                    ✓ BAN HÀNH
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>{cleanContent}</div>
                          )}
                          
                          {/* Hover actions (only for persistent sent messages) */}
                          {!isLocal && (
                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden opacity-0 group-hover/msg:opacity-100 transition-opacity min-w-max ${deletingMessageId === msg.id ? (isMe ? '-left-32' : '-right-32') : (isMe ? '-left-20' : '-right-20')}`}>
                              {deletingMessageId === msg.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5">
                                  <span className="text-[9px] font-bold text-rose-600 select-none px-1">Xóa?</span>
                                  <button
                                    onClick={() => {
                                      if (onDeleteChatMessage) {
                                        onDeleteChatMessage(msg.id, isMe ? 'everyone' : 'me');
                                      }
                                      setDeletingMessageId(null);
                                    }}
                                    className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                                    title="Xác nhận xóa"
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingMessageId(null)}
                                    className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                                    title="Hủy"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setReplyingTo({ messageId: msg.id, senderName: msg.senderName, contentSnippet: msg.content || (msg.fileName || 'Đính kèm') })}
                                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 cursor-pointer"
                                    title="Trả lời"
                                  >
                                    <Reply size={13} />
                                  </button>
                                  <button
                                    onClick={() => setForwardingMessage(msg)}
                                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 border-l border-slate-100 cursor-pointer"
                                    title="Chuyển tiếp"
                                  >
                                    <Forward size={13} />
                                  </button>
                                  {(isMe || currentUser.role === 'admin') && onDeleteChatMessage && (
                                    <button
                                      onClick={() => setDeletingMessageId(msg.id)}
                                      className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-rose-600 border-l border-slate-100 cursor-pointer"
                                      title="Xóa tin nhắn"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Local progress bar indicator */}
                          {isLocal && (
                            <div className="space-y-1 mt-2.5 min-w-[150px]">
                              <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className={isFailed ? 'text-rose-600' : 'text-slate-500'}>
                                  {isFailed ? 'Lỗi mất kết nối mạng' : 'Đang truyền file...'}
                                </span>
                                <span className={isFailed ? 'text-rose-600' : 'text-indigo-600'}>{msg.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${isFailed ? 'bg-rose-500' : 'bg-indigo-600'}`} 
                                  style={{ width: `${msg.progress}%` }} 
                                />
                              </div>
                            </div>
                          )}

                          {/* File / Image preview in bubble */}
                          {msg.fileUrl && (
                            <div className="mt-2 pt-2 border-t border-white/20 text-left">
                              {msg.fileType === 'image' ? (
                                <div className="relative group cursor-pointer" onClick={() => !isLocal && setPreviewFile({ isOpen: true, fileName: msg.fileName || 'Hình ảnh', fileUrl: msg.fileUrl || '', fileType: 'image' })}>
                                  <img src={msg.fileUrl} alt={msg.fileName} className="max-w-xs max-h-48 rounded-lg object-contain border border-black/10 shadow-xs transition-transform group-hover:scale-[1.01]" />
                                  {!isLocal && (
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                                      <Eye size={14} className="mr-1" /> Click xem nhanh
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <a href={isLocal ? undefined : msg.fileUrl} download={msg.fileName} className={`flex-1 flex items-center gap-1.5 p-2 rounded-xl text-[10px] font-bold transition-all no-underline truncate ${isLocal ? 'bg-slate-200 text-slate-500' : 'bg-black/15 hover:bg-black/25 text-white'}`}>
                                    <FileCheck size={13} className="shrink-0" />
                                    <span className="truncate max-w-[120px]">{msg.fileName}</span>
                                  </a>
                                  {!isLocal && (
                                    <button 
                                      type="button"
                                      onClick={() => setPreviewFile({
                                        isOpen: true,
                                        fileName: msg.fileName || 'Tài liệu',
                                        fileUrl: msg.fileUrl || '',
                                        fileType: 'file'
                                      })}
                                      className="p-2 bg-black/15 hover:bg-black/25 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                                      title="Xem nhanh trên web"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Error warning side trigger */}
                        {isFailed && (
                          <div className="relative flex items-center shrink-0">
                            <button
                              onClick={() => setFailedMsgActionId(failedMsgActionId === msg.id ? null : msg.id)}
                              className="p-1 bg-rose-50 text-rose-500 hover:text-rose-700 border border-rose-200 rounded-full transition-all cursor-pointer animate-bounce shadow-xs"
                              title="Tải lên thất bại. Click để xem lựa chọn."
                            >
                              <AlertCircle size={15} />
                            </button>

                            {failedMsgActionId === msg.id && (
                              <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setFailedMsgActionId(null)} />
                                <div className="absolute bottom-full mb-1.5 right-0 bg-white border border-slate-100 shadow-xl rounded-xl p-2 z-50 text-xs w-28 space-y-1 animate-slide-up">
                                  <p className="font-extrabold text-slate-400 text-[8.5px] text-center uppercase tracking-wider border-b border-slate-100 pb-1">Đường truyền lỗi</p>
                                  <button
                                    onClick={() => handleRetryUpload(msg.id)}
                                    className="w-full flex items-center gap-1 px-1.5 py-1 hover:bg-emerald-50 text-emerald-700 rounded-md font-bold text-[9px] transition-all cursor-pointer"
                                  >
                                    <RefreshCw size={10} />
                                    <span>Thử lại</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUpload(msg.id)}
                                    className="w-full flex items-center gap-1 px-1.5 py-1 hover:bg-rose-50 text-rose-600 rounded-md font-bold text-[9px] transition-all cursor-pointer"
                                  >
                                    <Trash2 size={10} />
                                    <span>Xóa bỏ</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form input field & upload previews */}
          <div className="bg-white border-t border-slate-100 shrink-0">
            {/* AI Suggested Prompts */}
            {activeChatTab === 'ai' && (
              <div className="px-3 pt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setInput('Quy trình nghỉ phép')} className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-100 transition-all cursor-pointer">Quy trình nghỉ phép</button>
                <button type="button" onClick={() => setInput('Mua thanh lý máy tính')} className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-100 transition-all cursor-pointer">Thanh lý thiết bị</button>
                <button type="button" onClick={() => setInput('Báo cáo lỗi hệ thống')} className="text-[10px] font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full border border-rose-100 transition-all cursor-pointer">Báo lỗi hệ thống</button>
                <button type="button" onClick={() => setInput('Liên hệ khẩn cấp bộ phận nhân sự')} className="text-[10px] font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full border border-amber-100 transition-all cursor-pointer">Liên hệ khẩn cấp</button>
              </div>
            )}
            
            {/* Attached file preview bar */}
            {attachedFile && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                  {attachedFile.type === 'image' ? <ImageIcon size={14} className="text-blue-500" /> : <Paperclip size={14} className="text-indigo-500" />}
                  <span className="truncate max-w-[300px]">{attachedFile.name}</span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Replying To Indicator */}
            {replyingTo && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between border-l-2 border-l-rose-500">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-rose-600">Đang trả lời {replyingTo.senderName}</span>
                  <span className="text-xs text-slate-500 truncate max-w-sm">{replyingTo.contentSnippet}</span>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            )}
            
            <form onSubmit={handleSend} className="p-3">
              <div className="flex space-x-2 items-center">
                {/* Media buttons (File & Image inputs) */}
                {activeChatTab !== 'ai' && (
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* Image Selector */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      title="Gửi hình ảnh"
                    >
                      <ImageIcon size={16} />
                    </button>
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'image')}
                    />

                    {/* File Selector */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      title="Gửi file đính kèm"
                    >
                      <Paperclip size={16} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'file')}
                    />
                  </div>
                )}

                {/* Main Input Textfield */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      activeChatTab === 'ai'
                        ? 'Ví dụ: Thiết bị cũ của em khi mua thanh lý sếp tính chiết khấu hao mòn thế nào?...'
                        : 'Nhập nội dung tin nhắn...'
                    }
                    className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl border border-slate-200/80 py-3 pl-4 pr-10 focus:ring-1 focus:ring-slate-400 focus:bg-white focus:outline-none"
                  />
                  
                  {/* Emoji Picker toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-amber-500 rounded-full transition-colors cursor-pointer"
                    title="Chèn biểu cảm"
                  >
                    <Smile size={16} />
                  </button>

                  {/* Absolute Emoji picker float */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-12 right-0 bg-white border border-slate-100 rounded-xl shadow-xl p-3 w-64 z-40 animate-fade-in"
                    >
                      <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biểu cảm nội bộ</span>
                        <button onClick={() => setShowEmojiPicker(false)} className="text-slate-300 hover:text-slate-500">✕</button>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-0.5">
                        {emojis.map((emoji, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-base hover:bg-slate-100 p-1 rounded transition-colors cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSending || (!input.trim() && !attachedFile)}
                  className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-sm disabled:opacity-50 cursor-pointer transition-all shrink-0 ${
                    activeChatTab === 'ai' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10' :
                    activeChatTab === 'corporate' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10' :
                    activeChatTab === 'department' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' :
                    'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>

      {/* MODAL: CREATE NEW GROUP */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateGroupModal(false)} />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Tạo Nhóm Chat Mới</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên nhóm</label>
                <input
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="VD: Nhóm Dự Án Sáng Tạo, Team IT..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Chọn thành viên tham gia (Tối thiểu 1)</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 p-2 rounded-xl">
                  {availableUsers.map(u => {
                    const isChecked = selectedGroupMembers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleGroupMemberSelection(u.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isChecked ? 'bg-rose-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-5 h-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-slate-700">{u.name} <span className="font-normal text-slate-400">({u.role})</span></span>
                        </div>
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateGroupModal(false)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Hủy</button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
                >
                  Khởi tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER TO ACTIVE 1-1 TO CREATE GROUP */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddMemberModal(false)} />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Lập Nhóm Chat</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleAddMemberToCreateGroup} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Nhóm bao gồm:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-1 rounded-lg border border-slate-200">
                    👑 Bạn ({currentUser.name})
                  </span>
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-lg border border-rose-200">
                    👤 {allUsers.find(u => u.id === selectedRecipientId)?.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên nhóm chat mới</label>
                <input
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="VD: Nhóm Dự Án Mới, Team Chuyên Gia..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Chọn thêm thành viên khác (Tối thiểu 1)</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar border border-slate-100 p-2 rounded-xl">
                  {availableUsers.filter(u => u.id !== selectedRecipientId).map(u => {
                    const isChecked = selectedGroupMembers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleGroupMemberSelection(u.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isChecked ? 'bg-rose-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-5 h-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                          <span className="text-xs font-bold text-slate-700">{u.name} <span className="font-normal text-slate-400">({u.role})</span></span>
                        </div>
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                          isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg">Hủy</button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim() || selectedGroupMembers.length === 0}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
                >
                  Tạo nhóm chat mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* MODAL: FORWARD MESSAGE */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setForwardingMessage(null)} />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Chuyển tiếp tin nhắn</h3>
              <button onClick={() => setForwardingMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 line-clamp-3">
                <span className="font-bold text-slate-700">{forwardingMessage.senderName}:</span> {forwardingMessage.content || forwardingMessage.fileName}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn người nhận</div>
              {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                <button
                  key={u.id}
                  onClick={async () => {
                    setIsSending(true);
                    try {
                      await onSendChatMessage('private', forwardingMessage.content, u.id, forwardingMessage.fileUrl, forwardingMessage.fileName, forwardingMessage.fileType, forwardingMessage.fileSize);
                      setForwardingMessage(null);
                    } catch (err) {
                      console.error(err);
                      alert('Lỗi chuyển tiếp.');
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  className="w-full text-left p-3 flex items-center space-x-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {/* MODAL: VIDEO MEETING (FACETIME) */}
      {activeVideoCall.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
          <div className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-xl z-10 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10">
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-white text-sm">
                  {activeVideoCall.isGroup ? 'Phòng Họp Trực Tuyến' : 'Cuộc Gọi Video'} • {activeVideoCall.partnerName}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-full">00:00</span>
            </div>
            
            {/* Video Area */}
            <div className="flex-1 p-6 flex flex-col md:flex-row gap-4 justify-center items-center relative">
              {/* Partner Video (Simulated) */}
              <div className="w-full h-full bg-slate-800 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 z-10" />
                <img 
                  src={activeVideoCall.isGroup ? "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800" : (allUsers.find(u => u.id === selectedRecipientId)?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800")} 
                  className="absolute inset-0 w-full h-full object-cover opacity-60" 
                  referrerPolicy="no-referrer"
                  alt="Partner Video"
                />
                <div className="z-20 text-center">
                  <div className="text-white font-bold mb-1 drop-shadow-md">{activeVideoCall.partnerName}</div>
                  <div className="text-xs text-slate-300 flex items-center justify-center gap-1">
                    <Mic size={12} className={Math.random() > 0.5 ? 'text-emerald-400' : 'text-slate-400'} />
                    Đang kết nối...
                  </div>
                </div>
              </div>

              {/* My Video (PiP style on desktop, side-by-side on mobile) */}
              <div className="md:absolute md:bottom-6 md:right-6 w-full md:w-48 md:h-64 h-48 bg-slate-800 rounded-xl border-2 border-slate-600 flex flex-col items-center justify-center relative overflow-hidden shadow-xl z-20">
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"} 
                  className={`absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity ${isVideoMuted ? 'opacity-20 blur-sm' : ''}`}
                  referrerPolicy="no-referrer"
                  alt="My Video"
                />
                {isVideoMuted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-10">
                    <VideoOff size={32} className="text-rose-500" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 z-20 flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur px-2 py-1 rounded-lg">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] text-white font-bold">{currentUser.name} (Bạn)</span>
                  {isAudioMuted && <MicOff size={10} className="text-rose-400 ml-1" />}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 flex justify-center items-center gap-4 bg-gradient-to-t from-slate-900 to-transparent">
              <button 
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`p-4 rounded-full transition-all ${isAudioMuted ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              >
                {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-4 rounded-full transition-all ${isVideoMuted ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              >
                {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              <button 
                onClick={() => setActiveVideoCall({ isOpen: false, partnerName: '', isGroup: false })}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all transform hover:scale-105 shadow-xl shadow-rose-600/30 ml-4"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL: QUICK PREVIEW */}
      <QuickPreviewModal
        isOpen={previewFile.isOpen}
        onClose={() => setPreviewFile(prev => ({ ...prev, isOpen: false }))}
        fileName={previewFile.fileName}
        fileUrl={previewFile.fileUrl}
        fileType={previewFile.fileType}
        fileSize={previewFile.fileSize}
      />

    </div>
  );
};
