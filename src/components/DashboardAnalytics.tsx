import React, { useState } from 'react';
import { WorkflowRequest, Asset, PaymentTransaction, User, FormTemplate } from '../types';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart2,
  PieChart,
  Activity,
  ArrowRight,
  Filter,
  DollarSign,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Percent,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface DashboardAnalyticsProps {
  requests: WorkflowRequest[];
  
  payments: PaymentTransaction[];
  users: User[];
  forms: FormTemplate[];
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  requests = [],
  
  payments = [],
  users = [],
  forms = []
}) => {
  // Tabs & Toggles state
  const [performanceChartType, setPerformanceChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [revenuePeriod, setRevenuePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [analyticsTab, setAnalyticsTab] = useState<'process' | 'revenue' | 'contracts'>('process');
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // 1. CALCULATIONS & AGGREGATIONS
  // ----------------------------------------------------
  
  // Basic counts
  const totalSubmissions = requests.length;
  const totalApproved = requests.filter((r) => r.status === 'approved').length;
  const totalPending = requests.filter((r) => r.status === 'pending').length;
  const totalRejected = requests.filter((r) => r.status === 'rejected').length;
  const completionRate = totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 75;
  const pendingRate = totalSubmissions > 0 ? Math.round((totalPending / totalSubmissions) * 100) : 15;
  const rejectionRate = totalSubmissions > 0 ? Math.round((totalRejected / totalSubmissions) * 100) : 10;

  // Form Popularity & Approved vs Unapproved aggregation
  const formStatsMap: Record<string, { title: string; count: number; approved: number; pending: number; rejected: number; percent: number }> = {};
  
  // Fill from known forms
  forms.forEach(f => {
    formStatsMap[f.id] = {
      title: f.title,
      count: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      percent: 0
    };
  });

  // Aggregate requests
  requests.forEach(r => {
    const key = r.formTemplateId || 'unknown';
    if (!formStatsMap[key]) {
      formStatsMap[key] = {
        title: r.formTitle || 'Biểu mẫu tùy chỉnh',
        count: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        percent: 0
      };
    }
    formStatsMap[key].count++;
    if (r.status === 'approved') formStatsMap[key].approved++;
    else if (r.status === 'pending') formStatsMap[key].pending++;
    else if (r.status === 'rejected') formStatsMap[key].rejected++;
  });

  // Calculate percentages and sort by popularity
  const popularForms = Object.entries(formStatsMap)
    .map(([id, stat]) => {
      const pct = totalSubmissions > 0 ? Math.round((stat.count / totalSubmissions) * 100) : 0;
      return {
        id,
        ...stat,
        percent: pct,
        approvalRate: stat.count > 0 ? Math.round((stat.approved / stat.count) * 100) : 0
      };
    })
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // If empty, supply mock baseline for beautiful rendering
  const displayPopularForms = popularForms.length > 0 ? popularForms : [
    { id: 'leave', title: 'Đơn xin nghỉ phép', count: 24, approved: 18, pending: 4, rejected: 2, percent: 45, approvalRate: 75 },
    { id: 'device', title: 'Đơn xin cấp thiết bị', count: 16, approved: 12, pending: 3, rejected: 1, percent: 30, approvalRate: 75 },
    { id: 'advance', title: 'Đề nghị tạm ứng thanh toán', count: 8, approved: 6, pending: 1, rejected: 1, percent: 15, approvalRate: 75 },
    { id: 'stationery', title: 'Yêu cầu văn phòng phẩm', count: 5, approved: 5, pending: 0, rejected: 0, percent: 10, approvalRate: 100 }
  ];

  // SLA times by category
  const categorySLAs = [
    { category: 'Đơn xin nghỉ phép', avgTime: 4.2, status: 'optimal', percent: 92, count: requests.filter(r => r.formTitle?.includes('nghỉ') || r.formTemplateId?.includes('leave')).length || 24 },
    { category: 'Đơn cấp thiết bị', avgTime: 8.5, status: 'warning', percent: 78, count: requests.filter(r => r.formTitle?.includes('thiết bị') || r.formTemplateId?.includes('device')).length || 16 },
    { category: 'Đơn tạm ứng tài chính', avgTime: 12.4, status: 'optimal', percent: 85, count: 8 },
    { category: 'Công văn & Công vụ', avgTime: 2.1, status: 'optimal', percent: 96, count: 12 }
  ];

  // Department Statistics Table (Percentage Table)
  const departmentStats = [
    { dept: 'Phòng Kỹ thuật (Tech)', count: 18, approved: 14, pending: 3, rejected: 1, approvedPct: 78, pendingPct: 17, rejectedPct: 5, avgSLA: '6.4 giờ', slaPct: 88 },
    { dept: 'Phòng Nhân sự (HR)', count: 12, approved: 10, pending: 1, rejected: 1, approvedPct: 83, pendingPct: 8, rejectedPct: 9, avgSLA: '3.1 giờ', slaPct: 95 },
    { dept: 'Phòng Tài chính (Finance)', count: 9, approved: 7, pending: 2, rejected: 0, approvedPct: 78, pendingPct: 22, rejectedPct: 0, avgSLA: '11.2 giờ', slaPct: 81 },
    { dept: 'Phòng Kinh doanh (Sales)', count: 15, approved: 12, pending: 2, rejected: 1, approvedPct: 80, pendingPct: 13, rejectedPct: 7, avgSLA: '5.2 giờ', slaPct: 90 },
    { dept: 'Hành chính (Admin)', count: 6, approved: 5, pending: 1, rejected: 0, approvedPct: 83, pendingPct: 17, rejectedPct: 0, avgSLA: '2.5 giờ', slaPct: 96 },
  ];

  // ----------------------------------------------------
  // 2. REVENUE ANALYSIS DATA (Tuần, Tháng, Quý, Năm)
  // ----------------------------------------------------
  const revenueDataByPeriod = {
    week: [
      { name: 'Thứ 2', revenue: 12500000, target: 10000000, count: 4 },
      { name: 'Thứ 3', revenue: 18000000, target: 12000000, count: 6 },
      { name: 'Thứ 4', revenue: 15200000, target: 11000000, count: 5 },
      { name: 'Thứ 5', revenue: 22000000, target: 15000000, count: 8 },
      { name: 'Thứ 6', revenue: 31000000, target: 18000000, count: 11 },
      { name: 'Thứ 7', revenue: 8500000, target: 8000000, count: 3 },
      { name: 'Chủ nhật', revenue: 4200000, target: 5000000, count: 1 }
    ],
    month: [
      { name: 'Tuần 1', revenue: 85000000, target: 80000000, count: 24 },
      { name: 'Tuần 2', revenue: 98000000, target: 90000000, count: 28 },
      { name: 'Tuần 3', revenue: 112000000, target: 95000000, count: 32 },
      { name: 'Tuần 4', revenue: 145000000, target: 105000000, count: 41 }
    ],
    quarter: [
      { name: 'Quý I', revenue: 380000000, target: 350000000, count: 98 },
      { name: 'Quý II', revenue: 440000000, target: 400000000, count: 115 },
      { name: 'Quý III', revenue: 520000000, target: 450000000, count: 134 },
      { name: 'Quý IV', revenue: 680000000, target: 550000000, count: 168 }
    ],
    year: [
      { name: 'Năm 2023', revenue: 1450000000, target: 130000000, count: 340 },
      { name: 'Năm 2024', revenue: 1820000000, target: 160000000, count: 420 },
      { name: 'Năm 2025', revenue: 2100000000, target: 190000000, count: 480 },
      { name: 'Năm 2026 (YTD)', revenue: 1540000000, target: 140000000, count: 395 }
    ]
  };

  const currentRevenueData = revenueDataByPeriod[revenuePeriod];
  const totalPeriodRevenue = currentRevenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPeriodTarget = currentRevenueData.reduce((acc, curr) => acc + curr.target, 0);
  const revenuePerformancePct = totalPeriodTarget > 0 ? Math.round((totalPeriodRevenue / totalPeriodTarget) * 100) : 100;

  // ----------------------------------------------------
  // 3. CONTRACT ANALYSIS DATA
  // ----------------------------------------------------
  const contractStats = {
    totalValue: 3450000000, // 3.45 Tỷ VND
    activeCount: 14,
    pendingCount: 4,
    expiringCount: 2,
    signedThisMonth: 5,
    distribution: [
      { name: 'Hợp đồng thương mại', value: 45, valAmount: 1552000000, color: '#2f80ed' },
      { name: 'Hợp đồng lao động', value: 30, valAmount: 1035000000, color: '#10b981' },
      { name: 'Hợp đồng dịch vụ', value: 15, valAmount: 517500000, color: '#f2994a' },
      { name: 'Hợp đồng bảo mật (NDA)', value: 10, valAmount: 345000000, color: '#9b51e0' }
    ],
    contractsList: [
      { id: 'HD-2026-001', name: 'Hợp đồng Cung cấp Thiết bị Phần mềm', client: 'Tập đoàn Điện lực VN', value: 850000000, status: 'signed', signDate: '2026-06-12', expiryDate: '2027-06-12' },
      { id: 'HD-2026-002', name: 'Hợp đồng Tư vấn Giải pháp Đám mây', client: 'Tổng Công ty Viễn thông Mobifone', value: 1200000000, status: 'signed', signDate: '2026-07-01', expiryDate: '2027-07-01' },
      { id: 'HD-2026-003', name: 'Hợp đồng Cung ứng Nhân sự Quản trị', client: 'Ngân hàng Techcombank', value: 450000000, status: 'pending', signDate: 'Dự kiến', expiryDate: '12 tháng' },
      { id: 'HD-2026-004', name: 'Hợp đồng Bảo trì Phần mềm DOCUSYS', client: 'Cục CNTT Bộ Công Thương', value: 950000000, status: 'expiring', signDate: '2025-08-15', expiryDate: '2026-08-15' }
    ]
  };

  // Recharts color palettes
  const COLORS = ['#2f80ed', '#10b981', '#f2994a', '#9b51e0', '#eb5757', '#27ae60'];

  // Form popularity pie chart data conversion
  const popularFormsChartData = displayPopularForms.map((item, idx) => ({
    name: item.title,
    value: item.count,
    color: COLORS[idx % COLORS.length]
  }));

  const filteredDeptStats = departmentStats.filter(stat => 
    (stat.dept && stat.dept.toLowerCase().includes((searchQuery || "").toLowerCase()))
  );

  const formatCurrency = (val: number) => {
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(2) + ' Tỷ đ';
    }
    return (val / 1000000).toFixed(1) + ' Tr đ';
  };

  return (
    <div className="bg-[#f0f4f8] min-h-screen p-4 sm:p-6 space-y-6 font-sans text-slate-700 flex flex-col justify-between" id="jin-dashboard">
      <div className="space-y-6">
        
        {/* Header Block with Tab Switcher */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e2eae8] shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center space-x-2">
              <Activity size={22} className="text-[#2f80ed]" />
              <span>PHÂN TÍCH QUY TRÌNH & HIỆU SUẤT DOANH NGHIỆP</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trực quan hóa hoạt động xử lý đơn duyệt, theo dõi SLA, phân tích doanh thu bán hàng & thiết bị, và thống kê sức khỏe hợp đồng DOCUSYS.
            </p>
          </div>

          {/* Core Navigation Sub-tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto self-stretch lg:self-auto shrink-0 border border-slate-200">
            <button
              onClick={() => setAnalyticsTab('process')}
              className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analyticsTab === 'process' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={13} />
              <span>Hiệu suất Quy trình</span>
            </button>
            <button
              onClick={() => setAnalyticsTab('revenue')}
              className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analyticsTab === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign size={13} />
              <span>Doanh thu & Tài chính</span>
            </button>
            <button
              onClick={() => setAnalyticsTab('contracts')}
              className={`flex-1 lg:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                analyticsTab === 'contracts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={13} />
              <span>Hợp đồng (Contracts)</span>
            </button>
          </div>
        </div>

        {/* Core Stats Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Total Processed */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tổng Đơn Trình Duyệt</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Zap size={14} /></span>
            </div>
            <div className="my-1">
              <p className="text-2xl font-black text-slate-800">{totalSubmissions || 64} <span className="text-xs font-bold text-slate-400">lượt chạy</span></p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="text-emerald-500 font-bold flex items-center gap-0.5"><TrendingUp size={10} /> +15.4%</span>
              <span>tự động hóa hoàn toàn</span>
            </div>
          </div>

          {/* Approved & Percent */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Đã Thông Qua (Approved)</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle size={14} /></span>
            </div>
            <div className="my-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-800">{totalApproved || 48}</p>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                {completionRate}% tổng đơn
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="text-emerald-500 font-extrabold">✓ Thành công</span>
              <span>quy trình duyệt rút ngắn</span>
            </div>
          </div>

          {/* Pending & Not Approved */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chưa Thông Qua / Đang Chờ</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><AlertTriangle size={14} /></span>
            </div>
            <div className="my-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-800">{totalPending || 12}</p>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                {pendingRate}% tỷ lệ tắc
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              <span>Đang kiểm tra và xử lý nút thắt</span>
            </div>
          </div>

          {/* Total Contracts / Value */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Doanh Số Hợp Đồng</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><DollarSign size={14} /></span>
            </div>
            <div className="my-1">
              <p className="text-2xl font-black text-slate-800">{formatCurrency(contractStats.totalValue)}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="text-purple-600 font-bold">{contractStats.activeCount} hợp đồng active</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            TAB 1: PROCESS PERFORMANCE & GRAPH ANALYSIS
            ---------------------------------------------------- */}
        {analyticsTab === 'process' && (
          <div className="space-y-6 animate-fade-in">
            {/* Chart Container Block */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">BIỂU ĐỒ PHÂN TÍCH QUY TRÌNH & ĐƠN PHỔ BIẾN</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Thống kê số lượng lượt chạy và phê duyệt thành công từng loại biểu mẫu.</p>
                </div>

                {/* Graph Type Toggles (Cột, Đường, Tròn) */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setPerformanceChartType('bar')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      performanceChartType === 'bar' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BarChart2 size={12} />
                    <span>Hình cột</span>
                  </button>
                  <button
                    onClick={() => setPerformanceChartType('line')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      performanceChartType === 'line' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Activity size={12} />
                    <span>Đồ thị đường</span>
                  </button>
                  <button
                    onClick={() => setPerformanceChartType('pie')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                      performanceChartType === 'pie' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <PieChart size={12} />
                    <span>Hình tròn</span>
                  </button>
                </div>
              </div>

              {/* Render Selected Graph */}
              <div className="h-[320px] w-full flex items-center justify-center pt-2">
                {performanceChartType === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayPopularForms} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="title" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2eae8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} 
                        formatter={(value, name) => [value, name === 'count' ? 'Tổng số đơn' : name === 'approved' ? 'Đã duyệt' : name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="count" fill="#2f80ed" name="Tổng Số Đơn" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="approved" fill="#10b981" name="Đã Thông Qua" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {performanceChartType === 'line' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayPopularForms} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="title" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="count" stroke="#2f80ed" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Tổng Số Đơn" />
                      <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} name="Đã Thông Qua" />
                      <Line type="monotone" dataKey="approvalRate" stroke="#f2994a" strokeWidth={2} strokeDasharray="4 4" name="Tỷ lệ duyệt (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {performanceChartType === 'pie' && (
                  <div className="w-full h-full flex flex-col md:flex-row items-center justify-around">
                    <div className="w-full md:w-1/2 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={popularFormsChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {popularFormsChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 text-xs">
                      {displayPopularForms.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2 p-2 border border-slate-50 bg-slate-50/50 rounded-lg">
                          <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-800 truncate" title={item.title}>{item.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.count} đơn ({item.percent}%)</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SLA breakdown & popular requests summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Popularity Aggregation Table */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">TỔNG HỢP BIỂU MẪU ĐƠN XIN PHỔ BIẾN & TỶ LỆ TRUYỀN TẢI</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Xếp hạng mức độ thông dụng của các thủ tục hành chính.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-3">Tên Biểu Mẫu</th>
                        <th className="py-2.5 px-3 text-center">Tổng Số Đơn</th>
                        <th className="py-2.5 px-3 text-center text-emerald-600">Đã Duyệt</th>
                        <th className="py-2.5 px-3 text-center text-amber-600">Đang Chờ</th>
                        <th className="py-2.5 px-3 text-center text-rose-500">Từ Chối</th>
                        <th className="py-2.5 px-3 text-right">Tỷ Lệ Duyệt %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayPopularForms.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{item.title}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{item.count}</td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-600 font-semibold">
                            {item.approved}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-600 font-semibold">
                            {item.pending}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-rose-500 font-semibold">
                            {item.rejected}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-blue-600">
                            {item.approvalRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SLA times */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Xử lý trễ & Phản hồi SLA</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi cảnh báo quy trình bị nghẽn vượt mức cho phép.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {categorySLAs.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f2994a]" />
                          <span className="font-bold text-slate-700">{item.category}</span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-[10px] font-bold">
                          <span className="text-slate-400">Trễ TB:</span>
                          <span className="text-amber-600">{item.avgTime}h</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.percent}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Đã kiểm tra {item.count} đơn</span>
                        <span className="font-semibold text-emerald-600">{item.percent}% đạt chuẩn SLA</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PERCENTAGE STATISTICS BY DEPARTMENT TABLE */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">BẢNG THỐNG KÊ CHI TIẾT TỶ LỆ THEO PHÒNG BAN VÀ QUY TRÌNH</h3>
                  <p className="text-[10px] text-slate-400">Tổng hợp hoạt động làm đơn, tỷ lệ duyệt thành công và chất lượng SLA theo đơn vị.</p>
                </div>
                <div className="relative flex items-center w-full sm:w-auto">
                  <Search size={12} className="absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phòng ban..."
                    className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-100 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-3">Phòng Ban / Đơn Vị</th>
                      <th className="py-3 px-3 text-center">Tổng Số Đơn</th>
                      <th className="py-3 px-3 text-center text-emerald-600">Duyệt (%)</th>
                      <th className="py-3 px-3 text-center text-amber-600">Chờ Duyệt (%)</th>
                      <th className="py-3 px-3 text-center text-rose-500">Bị Từ Chối (%)</th>
                      <th className="py-3 px-3 text-center">Thời Gian TB</th>
                      <th className="py-3 px-3 text-right">Đạt Chuẩn SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredDeptStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-slate-800">{stat.dept}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{stat.count}</td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-600 font-bold">
                          {stat.approved} ({stat.approvedPct}%)
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-amber-600 font-bold">
                          {stat.pending} ({stat.pendingPct}%)
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-rose-500 font-bold">
                          {stat.rejected} ({stat.rejectedPct}%)
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{stat.avgSLA}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 font-bold font-mono">
                            <span className={`w-1.5 h-1.5 rounded-full ${stat.slaPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className={stat.slaPct >= 90 ? 'text-emerald-600' : 'text-amber-600'}>{stat.slaPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDeptStats.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          Không tìm thấy phòng ban phù hợp với từ khóa tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 2: REVENUE ANALYSIS (Tuần, Tháng, Quý, Năm)
            ---------------------------------------------------- */}
        {analyticsTab === 'revenue' && (
          <div className="space-y-6 animate-fade-in">
            {/* Revenue Trend Area Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">XU HƯỚNG DOANH THU & CHỈ TIÊU KINH DOANH DOCUSYS</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi doanh thu thu hồi thiết bị, mua sắm và thanh toán so với kế hoạch đề ra.</p>
                </div>

                {/* Period Selectors (Tuần, Tháng, Quý, Năm) */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setRevenuePeriod('week')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      revenuePeriod === 'week' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tuần này
                  </button>
                  <button
                    onClick={() => setRevenuePeriod('month')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      revenuePeriod === 'month' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tháng này
                  </button>
                  <button
                    onClick={() => setRevenuePeriod('quarter')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      revenuePeriod === 'quarter' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Quý này
                  </button>
                  <button
                    onClick={() => setRevenuePeriod('year')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      revenuePeriod === 'year' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cả năm
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tổng Doanh Thu Đạt Được</span>
                  <p className="text-xl font-black text-slate-800">{(totalPeriodRevenue).toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Chỉ Tiêu Đề Ra</span>
                  <p className="text-xl font-black text-slate-500">{(totalPeriodTarget).toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tỷ Lệ Hoàn Thành Chỉ Tiêu</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-emerald-600">{revenuePerformancePct}%</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${revenuePerformancePct >= 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {revenuePerformancePct >= 100 ? 'Đạt Target' : 'Sát nút'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Area Line Chart for Revenue Trends */}
              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentRevenueData} margin={{ top: 10, right: 30, left: 15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2f80ed" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2f80ed" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#94a3b8" />
                    <YAxis tickFormatter={(val) => (val / 1000000) + 'M'} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(value) => [(Number(value)).toLocaleString('vi-VN') + ' đ']} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#2f80ed" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Doanh Thu Đạt Được" />
                    <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorTarget)" name="Chỉ Tiêu (KPI)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Transactions List (Revenue source) */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">NGUỒN DOANH THU & GIAO DỊCH PHÁT SINH</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Danh sách các hoạt động kinh doanh mang lại nguồn thu trực tiếp cho DOCUSYS Workspace.</p>
                </div>
                <button className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-bold transition-all">
                  <Download size={11} />
                  <span>Xuất báo cáo tài chính</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 px-3">Mã Giao Dịch</th>
                      <th className="py-2.5 px-3">Khách Hàng / Nhân Viên</th>
                      <th className="py-2.5 px-3">Loại Giao Dịch</th>
                      <th className="py-2.5 px-3">Sản Phẩm / Tài Sản Liên Quan</th>
                      <th className="py-2.5 px-3 text-center">Hình Thức</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-right">Số Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payments.length > 0 ? (
                      payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[10px] font-bold text-slate-500">{p.id.toUpperCase()}</td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">{p.userName}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                              p.type === 'buyback' ? 'bg-blue-50 text-blue-700' : p.type === 'rent' ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-700'
                            }`}>
                              {p.type === 'buyback' ? 'Thanh lý/Mua lại' : p.type === 'rent' ? 'Thuê thiết bị' : 'Khấu trừ lương'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.assetName || 'Gói dịch vụ bảo trì'}</td>
                          <td className="py-3 px-3 text-center text-[10px] text-slate-500 font-semibold">{p.paymentMethod.replace(/_/g, ' ').toUpperCase()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              ● Thành công
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-800">{(p.amount).toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))
                    ) : (
                      // Fallback mock transactions if empty
                      <>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[10px] font-bold text-slate-500">GD-2026-904</td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">Kim Kim Tiểu Trương</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-blue-50 text-blue-700">
                              Thanh lý/Mua lại
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">Dell XPS 15 9520 (32GB)</td>
                          <td className="py-3 px-3 text-center text-[10px] text-slate-500 font-semibold">DEDUCTION</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              ● Thành công
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-800">25.000.000 đ</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[10px] font-bold text-slate-500">GD-2026-905</td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">Vương An Na</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-purple-50 text-purple-700">
                              Thuê thiết bị
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">Màn hình Dell UltraSharp 27"</td>
                          <td className="py-3 px-3 text-center text-[10px] text-slate-500 font-semibold">CREDIT CARD</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              ● Thành công
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-800">450.000 đ</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 font-mono text-[10px] font-bold text-slate-500">GD-2026-906</td>
                          <td className="py-3 px-3 font-extrabold text-slate-800">Trịnh Y Kiện</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-50 text-amber-700">
                              Bồi thường hỏng hóc
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">Bàn phím cơ Leopold FC900R</td>
                          <td className="py-3 px-3 text-center text-[10px] text-slate-500 font-semibold">PAYROLL DEDUCTION</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              ● Thành công
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-800">1.800.000 đ</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB 3: CONTRACTS ANALYSIS
            ---------------------------------------------------- */}
        {analyticsTab === 'contracts' && (
          <div className="space-y-6 animate-fade-in">
            {/* Contracts Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hợp đồng Active</span>
                <p className="text-2xl font-black text-slate-800">{contractStats.activeCount} <span className="text-xs font-semibold text-slate-400">hồ sơ</span></p>
                <div className="text-[10px] text-emerald-600 font-bold">● Vận hành hoàn hảo</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đang đàm phán / Chờ duyệt</span>
                <p className="text-2xl font-black text-slate-800">{contractStats.pendingCount} <span className="text-xs font-semibold text-slate-400">chờ duyệt</span></p>
                <div className="text-[10px] text-amber-500 font-bold">▲ Cần xem xét điều khoản</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sắp hết hạn (&lt; 30 ngày)</span>
                <p className="text-2xl font-black text-rose-600">{contractStats.expiringCount} <span className="text-xs font-semibold text-rose-400">cần gia hạn</span></p>
                <div className="text-[10px] text-rose-500 font-bold">⚠️ Rủi ro gián đoạn dịch vụ</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ký mới trong tháng</span>
                <p className="text-2xl font-black text-emerald-600">+{contractStats.signedThisMonth} <span className="text-xs font-semibold text-emerald-400">hợp đồng</span></p>
                <div className="text-[10px] text-slate-400">Doanh số tăng trưởng tốt</div>
              </div>
            </div>

            {/* Contract breakdown charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Column 1: Contract types distribution (Pie chart) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">CƠ CẤU PHÂN BỔ LOẠI HỢP ĐỒNG</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tỷ trọng giá trị và số lượng theo phân loại hợp đồng của công ty.</p>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={contractStats.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {contractStats.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(value) => [value + '%', 'Tỷ trọng']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {contractStats.distribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 border-b border-slate-50">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-700">{item.name}</span>
                      </div>
                      <div className="font-mono text-right">
                        <span className="font-bold text-slate-800">{formatCurrency(item.valAmount)}</span>
                        <span className="text-slate-400 ml-1.5">({item.value}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Contracts list & Status */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">DANH SÁCH GIÁM SÁT TIẾN ĐỘ HỢP ĐỒNG</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi thời hạn gia hạn và thẩm định pháp lý các hợp đồng lớn.</p>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {contractStats.contractsList.map((item) => (
                    <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className="font-extrabold text-xs text-slate-800">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">Đối tác: <strong className="text-slate-700">{item.client}</strong></p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                          <span>Ký: {item.signDate}</span>
                          <span>|</span>
                          <span>Hết hạn: <strong className="text-rose-500">{item.expiryDate}</strong></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 sm:gap-1.5 self-stretch sm:self-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <span className="text-xs font-black font-mono text-slate-800">
                          {formatCurrency(item.value)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                          item.status === 'signed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {item.status === 'signed' ? 'Đã hiệu lực' :
                           item.status === 'pending' ? 'Đang soạn thảo' :
                           'Sắp hết hạn'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process Automation Recommendations & AI Insights */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f4f3]">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-[#2f80ed]" />
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">KHUYẾN NGHỊ PHÂN TÍCH TỪ TRỢ LÝ DOCUSYS AI</h3>
            </div>
            <span className="text-[9px] text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 font-bold uppercase tracking-wider">
              DOCUSYS AI Insight
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/15 space-y-2 hover:border-blue-300 transition-all">
              <span className="text-[9px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase">SLA Quy trình</span>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">Tự động duyệt nhanh (Auto-Approve) cho các đơn xin nghỉ dưới 2 ngày.</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Giúp phòng Kỹ thuật giảm tải 45% thời gian chờ phê duyệt thủ tục hành chính.</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/15 space-y-2 hover:border-emerald-300 transition-all">
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Doanh thu & Thiết bị</span>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">Doanh số thanh lý thiết bị Laptop cũ đạt mục tiêu sớm 5 ngày.</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Nhu cầu mua lại Dell XPS của nhân viên tăng 15%. Khuyến nghị bổ sung kho thanh lý.</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/15 space-y-2 hover:border-purple-300 transition-all md:col-span-2 lg:col-span-1">
              <span className="text-[9px] bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-full uppercase">Cảnh báo hợp đồng</span>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">01 hợp đồng bảo trì với Cục CNTT Bộ Công Thương sắp hết hạn.</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">Cần soạn văn bản gia hạn và chuyển phê duyệt trong tuần này để tránh phạt SLA.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Watermark with TikTok ID (Preserved precisely as requested) */}
      <footer className="mt-8 border-t border-[#e2eae8] pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-sans tracking-wide shrink-0">
        <p className="font-semibold text-[#0a2e24]">DOCUSYS Quản trị & Văn bản © 2026</p>
        <div className="flex items-center space-x-2 font-mono bg-[#f4f7f6] border border-[#e2eae8] px-3 py-1 rounded-full text-[9px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2f80ed] animate-pulse" />
          <span className="text-slate-500 select-all">Số TikTok: 777524698</span>
        </div>
      </footer>
    </div>
  );
};
