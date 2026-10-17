const fs = require('fs');
let content = fs.readFileSync('src/components/LiveChat.tsx', 'utf-8');

const videoModal = `
      {/* MODAL: VIDEO MEETING (FACETIME) */}
      {activeVideoCall.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
          <div className="w-full max-w-4xl h-[80vh] bg-slate-900 rounded-3xl z-10 overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10">
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
              <div className="w-full h-full bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group">
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
              <div className="md:absolute md:bottom-6 md:right-6 w-full md:w-48 md:h-64 h-48 bg-slate-800 rounded-2xl border-2 border-slate-600 flex flex-col items-center justify-center relative overflow-hidden shadow-xl z-20">
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"} 
                  className={\`absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity \${isVideoMuted ? 'opacity-20 blur-sm' : ''}\`}
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
                className={\`p-4 rounded-full transition-all \${isAudioMuted ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}\`}
              >
                {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={\`p-4 rounded-full transition-all \${isVideoMuted ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}\`}
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
      
      {/* MODAL: QUICK PREVIEW */}`;

content = content.replace(
  /\{\/\* MODAL: QUICK PREVIEW \*\/\}/,
  videoModal
);
fs.writeFileSync('src/components/LiveChat.tsx', content);
