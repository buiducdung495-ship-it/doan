import React, { useState } from 'react';
import { Asset, User, PaymentTransaction } from '../types';
import { 
  Laptop, 
  HelpCircle, 
  Inbox, 
  Settings, 
  UserCheck, 
  RotateCcw, 
  Coins, 
  ShoppingBag, 
  CreditCard, 
  QrCode, 
  CircleDollarSign,
  ClipboardList,
  ChevronRight,
  Info,
  CheckCircle2,
  Trash
} from 'lucide-react';

interface AssetManagerProps {
  assets: Asset[];
  currentUser: User;
  onAssetRequest: (assetId: string, details: string) => Promise<void>;
  onAssetReturn: (assetId: string, details: string, condition: number) => Promise<void>;
  onAssetExchange: (assetId: string, details: string) => Promise<void>;
  onAssetBuyback: (assetId: string, details: string) => Promise<void>;
  onApproveAssetAction: (assetId: string, action: 'assign' | 'return' | 'exchange' | 'buyback', paymentMethod?: 'credit_card' | 'e_wallet' | 'payroll_deduction') => Promise<void>;
  onRejectAssetAction: (assetId: string, comment: string) => Promise<void>;
  paymentTransactions: PaymentTransaction[];
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  currentUser,
  onAssetRequest,
  onAssetReturn,
  onAssetExchange,
  onAssetBuyback,
  onApproveAssetAction,
  onRejectAssetAction,
  paymentTransactions
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'my-assets' | 'approvals' | 'history'>(() => {
    return currentUser.role === 'admin' ? 'approvals' : 'store';
  });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Dialog Actions State
  const [actionType, setActionType] = useState<'request' | 'return' | 'exchange' | 'buyback' | 'reject' | 'checkout' | null>(null);
  const [textDetails, setTextDetails] = useState('');
  const [damageInput, setDamageInput] = useState<number>(10);
  const [rejectComment, setRejectComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Checkout Simulation State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'credit_card' | 'e_wallet' | 'payroll_deduction'>('payroll_deduction');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cvv, setCvv] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'qr' | 'success'>('form');

  // Filter Assets
  const availableAssets = assets.filter(a => a.status === 'available');
  const myAssignedAssets = assets.filter(a => a.assignedTo === currentUser.id);
  
  // Pending approvals list for Admins / Finance managers
  const pendingAssetApprovals = assets.filter(a => {
    if (!['pending_assign', 'pending_return', 'pending_exchange', 'pending_buyback'].includes(a.status)) return false;
    
    // Admins can approve everything, Finance managers can approve buybacks
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager' && currentUser.department === 'Finance' && a.status === 'pending_buyback') return true;
    
    return false;
  });

  const handleActionSubmit = async () => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'request') {
        await onAssetRequest(selectedAsset.id, textDetails);
      } else if (actionType === 'return') {
        await onAssetReturn(selectedAsset.id, textDetails, damageInput);
      } else if (actionType === 'exchange') {
        await onAssetExchange(selectedAsset.id, textDetails);
      } else if (actionType === 'buyback') {
        await onAssetBuyback(selectedAsset.id, textDetails);
      } else if (actionType === 'reject') {
        await onRejectAssetAction(selectedAsset.id, rejectComment);
      }
      
      setSelectedAsset(null);
      setActionType(null);
      setTextDetails('');
      setRejectComment('');
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      // Direct integration into service trigger
      await onApproveAssetAction(selectedAsset.id, 'buyback', selectedPaymentMethod);
      setCheckoutStep('success');
      setTimeout(() => {
        setSelectedAsset(null);
        setActionType(null);
        setCheckoutStep('form');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Ký duyệt hóa đơn thanh lý thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectApproveNonBuyback = async (asset: Asset, action: 'assign' | 'return' | 'exchange') => {
    try {
      await onApproveAssetAction(asset.id, action);
    } catch (err: any) {
      alert(err.message || 'Phê duyệt thất bại.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" id="assets-management-view">
      {/* Upper Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        {currentUser.role !== 'admin' && (
          <>
            <button
              onClick={() => setActiveSubTab('store')}
              className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
                activeSubTab === 'store'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Kho máy móc thiết bị ({availableAssets.length})
            </button>
            <button
              onClick={() => setActiveSubTab('my-assets')}
              className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
                activeSubTab === 'my-assets'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thiết bị tôi đang giữ ({myAssignedAssets.length})
            </button>
          </>
        )}
        
        {/* Only admins or Finance managers can inspect reviews */}
        {(currentUser.role === 'admin' || (currentUser.role === 'manager' && currentUser.department === 'Finance')) && (
          <button
            onClick={() => setActiveSubTab('approvals')}
            className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors relative cursor-pointer ${
              activeSubTab === 'approvals'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Duyệt thiết bị & Thanh lý
            {pendingAssetApprovals.length > 0 && (
              <span className="absolute top-1 right-[-4px] w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 font-semibold text-xs border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lịch sử giao dịch mua bán ({paymentTransactions.length})
        </button>
      </div>

      {/* RENDER TAB 1: STORE */}
      {activeSubTab === 'store' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl text-xs flex items-center justify-between text-slate-600">
            <p>
              Dưới đây là danh sách máy tính, màn hình, ghế văn phòng đang trống trong kho. Nhân viên có thể gửi đề xuất để được bàn giao sử dụng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAssets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl shadow-xs border border-slate-100 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 uppercase">
                      {asset.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Hao mòn: {asset.currentCondition}%</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mt-2">{asset.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed truncate-2-lines">{asset.description}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Giá thanh lý đề xuất:</span>
                    <span className="text-xs font-bold text-slate-800">{asset.currentPriceForSale.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <button
                    onClick={() => { setSelectedAsset(asset); setActionType('request'); }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đăng ký cấp phát
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: MY ASSIGNED ASSETS */}
      {activeSubTab === 'my-assets' && (
        <div className="space-y-4">
          {myAssignedAssets.length === 0 ? (
            <div className="bg-white rounded-xl p-16 text-center border border-slate-100 text-slate-400">
              <Laptop size={44} className="mx-auto stroke-1 text-slate-200 mb-2.5" />
              <h4 className="text-sm font-semibold">Bạn chưa giữ thiết bị nào của công ty</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Vui lòng chuyển qua mục "Kho máy móc thiết bị" để đăng ký mượn máy làm việc hoặc liên hệ IT.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAssignedAssets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl shadow-xs border border-slate-100 p-5 flex flex-col justify-between relative overflow-hidden">
                  
                  {asset.status !== 'assigned' && (
                    <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] border border-amber-200 uppercase">
                        {asset.status === 'pending_return' ? 'Chờ duyệt Trả máy' : asset.status === 'pending_exchange' ? 'Chờ duyệt Đổi máy' : 'Chờ duyệt Mua thanh lý'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Yêu cầu của bạn đã được gửi lên hệ thống và đang chờ Admin kho xét duyệt bàn giao.
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 uppercase">
                        {asset.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Bàn giao: {asset.assignmentDate ? new Date(asset.assignmentDate).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 mt-2">{asset.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{asset.description}</p>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 mt-3 flex justify-between items-center text-[10px] text-slate-600">
                      <span>Mức độ hao mòn khi bàn giao:</span>
                      <span className="font-bold">{asset.initialCondition}% hỏng hóc</span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-2.5 flex-wrap">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Ưu đãi mua thanh lý:</span>
                      <span className="text-xs font-bold text-indigo-600">{asset.currentPriceForSale.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('return'); }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Trả thiết bị
                      </button>
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('exchange'); }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Yêu cầu đổi máy
                      </button>
                      <button
                        onClick={() => { setSelectedAsset(asset); setActionType('buyback'); }}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Mua thanh lý đứt
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENDER TAB 3: SIGN-OFFS AND REVIEW */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-50">
              Danh Sách Yêu Cầu Thiết Bị Chờ Phê Duyệt ({pendingAssetApprovals.length})
            </h3>

            {pendingAssetApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckCircle2 size={36} className="text-slate-200 stroke-1 mb-2" />
                <p className="text-xs font-medium">Không có yêu cầu tài sản nào đang chờ duyệt</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {pendingAssetApprovals.map((asset) => {
                  const labelMap: Record<Asset['status'], { text: string, color: string }> = {
                    pending_assign: { text: 'Yêu cầu cấp phát', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                    pending_return: { text: 'Yêu cầu trả thiết bị', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                    pending_exchange: { text: 'Yêu cầu đổi thiết bị', color: 'bg-sky-50 text-sky-600 border-sky-100' },
                    pending_buyback: { text: 'Yêu cầu mua thanh lý', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    available: { text: '', color: '' },
                    assigned: { text: '', color: '' },
                    sold: { text: '', color: '' }
                  };
                  const badge = labelMap[asset.status] || { text: 'Yêu cầu', color: 'bg-slate-50' };

                  return (
                    <div key={asset.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${badge.color}`}>
                            {badge.text}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{asset.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-2">{asset.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Nhân viên đề xuất: <span className="font-semibold text-slate-700">{asset.assignedToName || 'Vô danh'}</span>
                          <p className="mt-1 bg-slate-50 p-2 rounded italic text-slate-600 border-l-2 border-indigo-500">
                            "Giải trình: {asset.requestDetails}"
                          </p>
                        </div>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => { setSelectedAsset(asset); setActionType('reject'); }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[10px] border border-rose-200 transition-colors cursor-pointer"
                        >
                          Từ chối
                        </button>
                        
                        {asset.status === 'pending_buyback' ? (
                          <button
                            onClick={() => { setSelectedAsset(asset); setActionType('checkout'); setCheckoutStep('form'); }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Coins size={12} />
                            <span>Ký Duyệt & Lập Hóa Đơn</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDirectApproveNonBuyback(
                              asset, 
                              asset.status === 'pending_assign' ? 'assign' : asset.status === 'pending_return' ? 'return' : 'exchange'
                            )}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Duyệt thông qua
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 4: TRANSACTION REGISTRY (HISTORY) */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-50">
              Hồ Sơ Mua Bán Thanh Lý Máy Móc Đã Thực Hiện ({paymentTransactions.length})
            </h3>

            {paymentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                <Coins size={36} className="text-slate-200 stroke-1 mb-2" />
                <p className="text-xs font-medium">Chưa phát sinh giao dịch mua bán tài sản nào</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">Khi nhân viên đăng ký mua thanh lý máy cũ và được duyệt, hóa đơn kế toán sẽ lưu trữ trực quan tại đây.</p>
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b border-slate-100">
                      <th className="py-2.5 px-3">Giao Dịch</th>
                      <th className="py-2.5 px-3">Nhân Viên Sở Hữu</th>
                      <th className="py-2.5 px-3">Tên Máy Móc</th>
                      <th className="py-2.5 px-3">Giá Trị Thanh Lý</th>
                      <th className="py-2.5 px-3">Phương Thức Thanh Toán</th>
                      <th className="py-2.5 px-3">Ngày Ký Nhận</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentTransactions.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-500">{tr.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{tr.userName}</td>
                        <td className="py-3 px-3 text-slate-600">{tr.assetName || 'Tài sản'}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{tr.amount.toLocaleString('vi-VN')} đ</td>
                        <td className="py-3 px-3 font-medium">
                          {tr.paymentMethod === 'payroll_deduction' ? (
                            <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100 font-semibold">Khấu trừ lương tháng</span>
                          ) : tr.paymentMethod === 'credit_card' ? (
                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] border border-blue-100 font-semibold">Thẻ tín dụng</span>
                          ) : (
                            <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] border border-purple-100 font-semibold font-mono">Ví điện tử MoMo QR</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {new Date(tr.timestamp).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">Thành công</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG 1: TEXT DETAILS POPUP */}
      {selectedAsset && actionType && actionType !== 'checkout' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {actionType === 'request' ? 'Đăng ký nhận máy móc' : actionType === 'return' ? 'Trả lại thiết bị văn phòng' : actionType === 'exchange' ? 'Yêu cầu đổi trả thiết bị' : actionType === 'buyback' ? 'Đăng ký mua thanh lý máy móc' : 'Từ chối phê duyệt'}
              </h3>
              <button onClick={() => { setSelectedAsset(null); setActionType(null); }} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                ✕
              </button>
            </div>

            {/* If return, add condition slider */}
            {actionType === 'return' && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Mức độ hao mòn / hỏng hóc thực tế hiện tại (%):</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={damageInput}
                    onChange={(e) => setDamageInput(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-bold font-mono text-slate-800">{damageInput}% hỏng</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-snug">
                  *Vui lòng ước lượng chính xác tỷ lệ khấu hao máy tính (màn hình xước dăm, lỗi phím dính...) để thủ kho lập biên bản chính xác.
                </p>
              </div>
            )}

            {actionType === 'reject' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Nhập lý do từ chối phê duyệt cấp phát / đổi trả:</label>
                <textarea
                  rows={3}
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Lý do cụ thể..."
                  className="w-full bg-slate-50 text-slate-800 text-xs rounded border border-slate-200 py-2.5 px-3 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Lý do & Giải trình chi tiết gửi sếp:</label>
                <textarea
                  rows={4}
                  value={textDetails}
                  onChange={(e) => setTextDetails(e.target.value)}
                  placeholder={
                    actionType === 'request'
                      ? 'Em viết đơn xin được cấp thiết bị này để phục vụ công tác lập trình dự án...'
                      : actionType === 'buyback'
                        ? 'Máy tính của em đã dùng 3 năm, em mong muốn được mua lại thanh lý từ công ty để làm việc cá nhân...'
                        : 'Giải trình chi tiết lý do đổi trả / bàn giao máy cũ...'
                  }
                  className="w-full bg-slate-50 text-slate-800 text-xs rounded border border-slate-200 py-2.5 px-3 focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => { setSelectedAsset(null); setActionType(null); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác nhận gửi'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DIALOG 2: SECURE CHECKOUT PORTAL SIMULATOR FOR BUYBACKS */}
      {selectedAsset && actionType === 'checkout' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700">Cổng Thanh Toán Kế Toán Doanh Nghiệp (Simulated)</span>
              <button 
                onClick={() => { setSelectedAsset(null); setActionType(null); }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
              >
                ✕
              </button>
            </div>

            {checkoutStep === 'form' ? (
              <div className="p-6 space-y-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">THIẾT BỊ HOÁN ĐỔI / MUA:</span>
                    <span className="font-semibold text-slate-800 block truncate">{selectedAsset.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono block">GIÁ QUY ĐỊNH THANH LÝ:</span>
                    <span className="font-bold text-indigo-600 text-sm block">{selectedAsset.currentPriceForSale.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/50 pt-2 text-[10px] text-slate-500">
                    Bằng việc ký duyệt, tài sản này sẽ chuyển nhượng sang trạng thái <b>Sở hữu cá nhân</b> của nhân viên: <b>{selectedAsset.assignedToName}</b>.
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">Lựa chọn Hình thức thanh toán trực tuyến:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Method 1: Payroll Deduction */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('payroll_deduction')}
                      className={`p-3.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedPaymentMethod === 'payroll_deduction'
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 shadow-3xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <CircleDollarSign size={20} />
                      <span className="text-[10px] font-semibold">Khấu trừ vào lương</span>
                    </button>

                    {/* Method 2: Credit Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('credit_card')}
                      className={`p-3.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedPaymentMethod === 'credit_card'
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 shadow-3xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-[10px] font-semibold">Thẻ tín dụng</span>
                    </button>

                    {/* Method 3: Momo/ZaloPay QR */}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('e_wallet')}
                      className={`p-3.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedPaymentMethod === 'e_wallet'
                          ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 shadow-3xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <QrCode size={20} />
                      <span className="text-[10px] font-semibold">Ví MoMo QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Fields depending on selection */}
                {selectedPaymentMethod === 'credit_card' && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-slate-500" />
                      Thông tin thẻ quốc tế Visa / Mastercard
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Số thẻ ghi nợ (Card Number):</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-white text-xs rounded border border-slate-200 py-1.5 px-2.5 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Tên chủ thẻ (Card Holder Name):</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-white text-xs rounded border border-slate-200 py-1.5 px-2.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Mã CVV bảo mật:</label>
                          <input
                            type="password"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            maxLength={3}
                            placeholder="***"
                            className="w-full bg-white text-xs rounded border border-slate-200 py-1.5 px-2.5 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'e_wallet' && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                      <QrCode size={14} className="text-slate-500" />
                      Thanh toán MoMo / ZaloPay thông minh
                    </h4>
                    <div className="flex flex-col items-center py-4 bg-white rounded border border-slate-200">
                      <div className="p-2 border border-slate-100 bg-slate-50 rounded">
                        {/* Elegant Canvas simulated QR */}
                        <div className="w-32 h-32 bg-slate-800 flex items-center justify-center text-white relative">
                          <QrCode size={96} className="text-white shrink-0" />
                          <div className="absolute inset-0 bg-indigo-950/20" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Quét mã QR bằng ứng dụng ngân hàng hoặc ví MoMo để hoàn tất</p>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'payroll_deduction' && (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-950 leading-relaxed flex items-start gap-2">
                    <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <b>Khấu trừ trực tiếp vào bảng lương hàng tháng:</b> Số tiền thanh lý sẽ tự động trừ thẳng vào khoản lương của nhân viên <b>{selectedAsset.assignedToName}</b> trong đợt phát lương của tháng tiếp theo. Thủ tục này bảo mật và có giá trị thanh lý nội bộ chuẩn chỉ.
                    </div>
                  </div>
                )}

                {/* Footer submit */}
                <div className="flex justify-end space-x-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => { setSelectedAsset(null); setActionType(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleCheckoutSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-emerald-600/10"
                  >
                    <CheckCircle2 size={13} />
                    <span>{isSubmitting ? 'Đang thực hiện thanh toán...' : 'Đồng ý Ký & Bàn Giao Bán Đứt'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3.5 bg-white">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Ký Duyệt & Bàn Giao Bán Đứt Thành Công!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Hóa đơn thanh lý tài sản đã được lưu vết thành công vào Sổ cái Kế toán Công ty. Nhân viên sẽ nhận được thông báo đẩy biên lai sở hữu tài sản hoàn tất.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
