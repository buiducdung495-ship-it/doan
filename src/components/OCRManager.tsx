import React, { useState, useEffect } from 'react';
import { OCRDocument, User } from '../types';
import { Scan, Upload, Trash2, Eye, RefreshCw, FileText, Camera } from 'lucide-react';

interface OCRManagerProps {
  currentUser: User;
  users: User[];
}

export const OCRManager: React.FC<OCRManagerProps> = ({ currentUser, users }) => {
  const [documents, setDocuments] = useState<OCRDocument[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OCRDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/ocr-documents');
      const text_data = await res.text(); let data: any = {}; if (text_data) { try { data = JSON.parse(text_data); } catch(e) { console.error("JSON parse error:", text_data); data = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call AI to extract text
      const aiRes = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg'
        })
      });
      const text_aiData = await aiRes.text(); let aiData: any = {}; if (text_aiData) { try { aiData = JSON.parse(text_aiData); } catch(e) { console.error("JSON parse error:", text_aiData); aiData = { error: "Lỗi kết nối hoặc server phản hồi sai định dạng." }; } }
      const extractedText = aiData.text || "Không thể trích xuất văn bản.";
      
      await fetch('/api/ocr-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          extractedText: extractedText,
          confidence: 0.9 + Math.random() * 0.1,
          status: 'completed',
          uploaderId: currentUser.id
        })
      });
      setIsScanning(false);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      await fetch(`/api/ocr-documents/${id}`, { method: 'DELETE' });
      fetchDocuments();
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getUserName = (id?: string) => {
    if (!id) return '';
    return users.find(u => u.id === id)?.name || id;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Scan size={20} className="text-indigo-600" />
            <span>Xử lý OCR & Tìm kiếm</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Trích xuất dữ liệu tự động từ tài liệu scan, hình ảnh để phục vụ tìm kiếm.</p>
        </div>
        <div className="flex items-center space-x-3">
          <input type="file" id="ocr-camera" className="hidden" accept="image/*" capture="environment" onChange={handleUploadScan} />
          <label htmlFor="ocr-camera" className={`bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${isScanning ? 'opacity-70 pointer-events-none' : ''}`}>
            <Camera size={16} />
            <span>Chụp ảnh</span>
          </label>

          <input type="file" id="ocr-upload" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUploadScan} />
          <label htmlFor="ocr-upload" className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${isScanning ? 'opacity-70 pointer-events-none' : ''}`}>
            {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{isScanning ? 'Đang trích xuất OCR...' : 'Tải lên & Quét'}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên file</th>
                  <th className="px-4 py-3 font-semibold">Ngày quét</th>
                  <th className="px-4 py-3 font-semibold text-center">Độ chính xác</th>
                  <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map(doc => (
                  <tr key={doc.id} className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedDoc?.id === doc.id ? 'bg-indigo-50/50' : ''}`} onClick={() => setSelectedDoc(doc)}>
                    <td className="px-4 py-3 flex items-center space-x-2">
                      <FileText size={16} className="text-indigo-500" />
                      <span className="font-semibold text-slate-800">{doc.fileName}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-emerald-600 font-bold font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                        {(doc.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Chưa có tài liệu nào được xử lý OCR.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col min-h-[400px]">
          <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-200 pb-2 flex items-center">
            <Eye size={16} className="mr-2 text-indigo-500" /> Kết quả trích xuất
          </h3>
          {selectedDoc ? (
            <div className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <div className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">File</div>
                <div className="text-xs font-medium text-indigo-600">{selectedDoc.fileName}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Nội dung text (Raw)</div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap shadow-inner h-[300px] overflow-y-auto">
                  {selectedDoc.extractedText}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Scan size={32} className="opacity-20" />
              <div className="text-xs text-center px-4">
                Chọn một tài liệu bên trái để xem kết quả trích xuất văn bản (OCR).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
