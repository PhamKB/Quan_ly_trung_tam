import React, { useState } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, CheckCircle, RefreshCw, AlertTriangle, FileText, Download, Trash2, Eye } from 'lucide-react';
import { Invoice, Payment, Refund, Student } from '../types';
import { formatVND, INITIAL_PAYMENTS, INITIAL_REFUNDS } from '../data';
import { Button, Badge, Card } from './Common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface FinanceViewProps {
  invoices: Invoice[];
  students: Student[];
  onAddPayment: (payment: Payment) => void;
  onApproveRefund: (refundId: string) => void;
  onRaiseToast: (msg: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ 
  invoices, 
  students, 
  onAddPayment, 
  onApproveRefund,
  onRaiseToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tuition' | 'invoices' | 'payments' | 'refunds'>('tuition');
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Refund Dialog controller
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState<boolean>(false);

  // In-memory collections
  const [paymentsList, setPaymentsList] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [refundsList, setRefundsList] = useState<Refund[]>(INITIAL_REFUNDS);

  // Stats setup
  const totalRevenue = 1280000000;
  const totalExpense = 760000000;
  const netProfit = totalRevenue - totalExpense;
  const outstandingDebt = 186500000;

  // Chart data
  const monthlyRevenueData = [
    { month: 'T2', 'Doanh thu': 920000000, 'Chi phí': 620000000 },
    { month: 'T3', 'Doanh thu': 1050000000, 'Chi phí': 680000000 },
    { month: 'T4', 'Doanh thu': 1120000000, 'Chi phí': 710000000 },
    { month: 'T5', 'Doanh thu': 1180000000, 'Chi phí': 740000000 },
    { month: 'T6', 'Doanh thu': 1240000000, 'Chi phí': 750000000 },
    { month: 'T7', 'Doanh thu': 1280000000, 'Chi phí': 760000000 },
  ];

  const debtAgingData = [
    { name: '0–30 ngày', 'Nợ học phí': 92500000 },
    { name: '31–60 ngày', 'Nợ học phí': 54000000 },
    { name: '61–90 ngày', 'Nợ học phí': 25000000 },
    { name: 'Trên 90 ngày', 'Nợ học phí': 15000000 },
  ];

  const handleRefundAction = (refund: Refund, approve: boolean) => {
    setSelectedRefund(refund);
    setIsConfirmingRefund(true);
  };

  const confirmRefundApproval = () => {
    if (selectedRefund) {
      setRefundsList(prev => prev.map(r => r.id === selectedRefund.id ? { ...r, status: 'Đã hoàn' } : r));
      onRaiseToast(`✓ Đã phê duyệt hoàn phí mã số ${selectedRefund.id} (Số tiền: ${formatVND(selectedRefund.amount)}) thành công.`);
      setIsConfirmingRefund(false);
      setSelectedRefund(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Finance Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiItem label="Doanh thu tháng 7" value={formatVND(totalRevenue)} color="text-[#2D3748]" subtitle="Đạt 98% chỉ tiêu đặt ra" />
        <KpiItem label="Chi phí vận hành" value={formatVND(totalExpense)} color="text-[#EB5757]" subtitle="Tiền nhà, điện nước & lương" />
        <KpiItem label="Lợi nhuận ròng" value={formatVND(netProfit)} color="text-[#27AE60]" subtitle="Tỷ suất sinh lời ~40.6%" />
        <KpiItem label="Nợ quá hạn tồn đọng" value={formatVND(outstandingDebt)} color="text-amber-600" subtitle="Tỷ lệ thu hồi nợ 91.4%" />
      </div>

      {/* Finance Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card title="Phân tích Doanh thu vs Chi phí hàng tháng" subtitle="Bản so sánh đối lập luồng thu nhập và chi phí vận hành">
            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Doanh thu" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chi phí" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title="Cơ cấu công nợ quá hạn" subtitle="Phân loại thời gian chậm đóng học phí">
            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={debtAgingData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                  <XAxis type="number" tickFormatter={(v) => `${v/1000000}tr`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip formatter={(v: number) => formatVND(v)} />
                  <Bar dataKey="Nợ học phí" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Finance Screen Sub navigation menu */}
      <div className="flex border-b border-[#DCE7F3] space-x-1">
        {[
          { id: 'tuition', label: 'Công nợ Học phí' },
          { id: 'invoices', label: 'Hóa đơn tài chính' },
          { id: 'payments', label: 'Phiếu thu & Thanh toán' },
          { id: 'refunds', label: 'Hoàn trả & Trút học phí' },
        ].map(sub => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeSubTab === sub.id 
                ? 'border-[#1C6DD0] text-[#1C6DD0]' 
                : 'border-transparent text-[#718096] hover:text-[#2D3748]'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* SUB-TABS INTERACTIVE LAYOUTS */}
      {activeSubTab === 'tuition' && (
        <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã học viên</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Học viên</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Lớp học</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Tổng phải nộp</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Đã nộp</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Còn lại</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Hạn nộp</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const remaining = student.tuitionOwed;
                const total = student.tuitionPaid + student.tuitionOwed;

                return (
                  <tr key={student.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                    <td className="p-3 font-mono text-xs text-[#2D3748]">{student.id}</td>
                    <td className="p-3 text-xs font-bold text-[#2D3748]">{student.name}</td>
                    <td className="p-3 text-xs text-[#718096]">{student.className}</td>
                    <td className="p-3 text-xs font-bold text-[#2D3748]">{formatVND(total)}</td>
                    <td className="p-3 text-xs text-emerald-600 font-semibold">{formatVND(student.tuitionPaid)}</td>
                    <td className="p-3 text-xs text-rose-600 font-bold">{formatVND(remaining)}</td>
                    <td className="p-3 text-xs text-[#718096] font-medium">15/08/2026</td>
                    <td className="p-3 text-xs">
                      <Badge status={remaining > 0 ? 'Còn nợ' : 'Đã thanh toán'}>
                        {remaining > 0 ? 'Còn nợ' : 'Đã nộp đủ'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar inside Invoices */}
          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE7F3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex items-center w-full max-w-xs">
              <input
                type="text"
                placeholder="Tìm hóa đơn, học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-[#DCE7F3] bg-white px-3 text-xs text-[#2D3748] focus:border-[#2F80ED]"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Paid">Đã thanh toán (Paid)</option>
              <option value="Partially Paid">Thanh toán một phần</option>
              <option value="Overdue">Quá hạn</option>
            </select>
          </div>

          <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã hóa đơn</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Học viên</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Lớp học</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Ngày phát hành</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Hạn nộp</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số tiền</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Đã nộp</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                    <td className="p-3 font-mono text-xs text-[#2D3748] font-bold">{inv.id}</td>
                    <td className="p-3 text-xs font-bold text-[#2D3748]">{inv.studentName}</td>
                    <td className="p-3 text-xs text-[#718096]">{inv.className}</td>
                    <td className="p-3 text-xs text-[#718096]">{inv.dateIssued}</td>
                    <td className="p-3 text-xs text-[#718096]">{inv.dueDate}</td>
                    <td className="p-3 text-xs font-bold text-[#2D3748]">{formatVND(inv.amount)}</td>
                    <td className="p-3 text-xs text-emerald-600 font-bold">{formatVND(inv.paidAmount)}</td>
                    <td className="p-3 text-xs">
                      <Badge status={inv.status}>{inv.status}</Badge>
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      <Button variant="soft" size="sm" className="mr-1 inline-flex items-center" title="Xem chi tiết hóa đơn">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="secondary" size="sm" className="inline-flex items-center" title="Tải PDF">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'payments' && (
        <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã giao dịch</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã hóa đơn</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Học viên</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số tiền thu</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Phương thức</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Ngày giao dịch</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Người lập</th>
                <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paymentsList.map((pay) => (
                <tr key={pay.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                  <td className="p-3 font-mono text-xs text-[#2D3748] font-bold">{pay.id}</td>
                  <td className="p-3 font-mono text-xs text-[#718096]">{pay.invoiceId}</td>
                  <td className="p-3 text-xs font-bold text-[#2D3748]">{pay.studentName}</td>
                  <td className="p-3 text-xs font-bold text-emerald-600">{formatVND(pay.amount)}</td>
                  <td className="p-3 text-xs text-[#2D3748] font-medium">{pay.method}</td>
                  <td className="p-3 text-xs text-[#718096]">{pay.date}</td>
                  <td className="p-3 text-xs text-[#718096]">{pay.processor}</td>
                  <td className="p-3 text-xs">
                    <Badge status="success">{pay.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'refunds' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã yêu cầu</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Học viên</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Hóa đơn gốc</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số tiền hoàn</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Lý do</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Người gửi yêu cầu</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Ngày tạo</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Phê duyệt</th>
                </tr>
              </thead>
              <tbody>
                {refundsList.map((ref) => (
                  <tr key={ref.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                    <td className="p-3 font-mono text-xs text-[#2D3748] font-bold">{ref.id}</td>
                    <td className="p-3 text-xs font-bold text-[#2D3748]">{ref.studentName}</td>
                    <td className="p-3 font-mono text-xs text-[#718096]">{ref.invoiceId}</td>
                    <td className="p-3 text-xs font-bold text-rose-600">{formatVND(ref.amount)}</td>
                    <td className="p-3 text-xs text-[#718096] max-w-[200px] truncate" title={ref.reason}>{ref.reason}</td>
                    <td className="p-3 text-xs text-[#718096]">{ref.requester}</td>
                    <td className="p-3 text-xs text-[#718096]">{ref.date}</td>
                    <td className="p-3 text-xs">
                      <Badge status={ref.status === 'Chờ duyệt' ? 'Chờ xử lý' : 'Đã hoàn'}>{ref.status}</Badge>
                    </td>
                    <td className="p-2 text-center">
                      {ref.status === 'Chờ duyệt' ? (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="font-bold cursor-pointer bg-amber-500 hover:bg-amber-600 text-xs px-2.5 h-8.5 rounded-md"
                          onClick={() => handleRefundAction(ref, true)}
                        >
                          Duyệt hoàn phí
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] font-semibold">Đã hoàn thành</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Refund Approval Confirmation Modal */}
          {selectedRefund && isConfirmingRefund && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsConfirmingRefund(false)} />
              <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#DCE7F3] bg-white p-6 shadow-2xl text-left">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-50 p-2 text-amber-500 shrink-0">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#2D3748]">Xác nhận phê duyệt hoàn tiền?</h3>
                    <p className="text-xs text-[#718096] mt-1">Hành động này không thể hoàn tác.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#F7FAFC] border border-[#DCE7F3] p-3 text-xs text-[#2D3748] space-y-1.5">
                  <div><strong>Mã yêu cầu:</strong> <span className="font-mono">{selectedRefund.id}</span></div>
                  <div><strong>Học viên:</strong> {selectedRefund.studentName}</div>
                  <div><strong>Số tiền hoàn:</strong> <span className="text-rose-600 font-bold">{formatVND(selectedRefund.amount)}</span></div>
                  <div><strong>Lý do:</strong> {selectedRefund.reason}</div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-[#EDF2F7] pt-4">
                  <Button variant="secondary" size="sm" className="cursor-pointer" onClick={() => setIsConfirmingRefund(false)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="primary" size="sm" className="cursor-pointer bg-amber-500 hover:bg-amber-600" onClick={confirmRefundApproval}>
                    Xác nhận phê duyệt hoàn tiền
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Internal mini KPI item helper
const KpiItem: React.FC<{ label: string; value: string; color: string; subtitle: string }> = ({ label, value, color, subtitle }) => (
  <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">{label}</span>
    <span className={`font-display text-lg md:text-xl font-extrabold ${color} mt-1.5 block`}>{value}</span>
    <span className="text-[10px] text-[#94A3B8] font-medium block mt-1">{subtitle}</span>
  </div>
);
