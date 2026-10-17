import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Check, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (base64Image: string) => void;
  onCancel: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas internal resolution to match container sizing
    canvas.width = canvas.offsetWidth || 500;
    canvas.height = canvas.offsetHeight || 180;
    
    ctx.strokeStyle = '#1e3a8a'; // Deep blue ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const preventScroll = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('touchstart', preventScroll, { passive: false });
    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchstart', preventScroll);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center select-none">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
          <PenTool size={11} className="text-indigo-400 animate-pulse" />
          <span>Vẽ chữ ký của bạn vào khung bên dưới</span>
        </span>
        {hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-extrabold flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 size={11} />
            <span>Xóa chữ ký</span>
          </button>
        )}
      </div>
      
      <div className="relative border-2 border-dashed border-slate-700 bg-slate-950 rounded-xl overflow-hidden cursor-crosshair h-44">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full block bg-slate-950"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1 text-slate-500 pointer-events-none select-none">
            <span className="text-xs font-bold text-slate-400">Dùng chuột hoặc cảm ứng để ký</span>
            <span className="text-[10px] text-slate-600">Nét mực màu xanh nước biển đậm truyền thống</span>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
        >
          Quay lại
        </button>
        <button
          type="button"
          disabled={!hasDrawn}
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 ${
            hasDrawn 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check size={12} />
          <span>Sử dụng chữ ký này</span>
        </button>
      </div>
    </div>
  );
};
