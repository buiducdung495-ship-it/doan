import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  FileText, 
  Eye, 
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface QuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
  fileSize
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Simple file extension extraction
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  // Determine actual file kind
  const isImage = fileType === 'image' || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isPdf = ['pdf'].includes(fileExtension);
  const isDocx = ['docx', 'doc', 'odt'].includes(fileExtension);
  const isExcel = ['xlsx', 'xls', 'csv'].includes(fileExtension);

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Không rõ dung lượng';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in border border-slate-100">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm shrink-0">
              <FileText size={18} />
            </div>
            <div className="truncate text-left">
              <h4 className="text-xs font-extrabold truncate text-white">{fileName}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                Định dạng: {fileExtension} • Size: {formatSize(fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              title="Tải về máy"
            >
              <Download size={14} />
              <span className="text-[10px] font-bold uppercase hidden sm:block">Tải về</span>
            </button>

            <div className="w-px h-6 bg-slate-700"></div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X size={16} />
              <span className="text-[10px] font-bold uppercase hidden sm:block">Đóng</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-slate-100 flex items-center justify-center p-4">
          {isImage ? (
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-w-full max-h-full object-contain rounded drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <iframe 
                src={fileUrl} 
                className="w-full h-full border-0 bg-white shadow-sm rounded-lg"
                title={fileName}
              />
              <div className="absolute top-8 left-8 right-8 pointer-events-none flex justify-center">
                 <span className="bg-slate-800/80 text-white text-[11px] px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
                   Nếu trình duyệt không hỗ trợ hiển thị tệp này, tệp có thể tải xuống tự động hoặc hiển thị trắng.
                 </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
