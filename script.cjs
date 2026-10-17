const fs = require('fs');
const content = fs.readFileSync('src/components/QuickPreviewModal.tsx', 'utf8');

const returnIdx = content.indexOf('return (');
if (returnIdx !== -1) {
  const head = content.substring(0, returnIdx);
  const newReturn = `return (
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
`;
  fs.writeFileSync('src/components/QuickPreviewModal.tsx', head + newReturn);
  console.log("Updated QuickPreviewModal.tsx");
}
