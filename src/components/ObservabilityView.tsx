import React, { useState } from 'react';
import { ShieldCheck, Activity, Eye, Cpu, Database, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditLog } from '../types';
import { Badge, Button } from './Common';

interface ObservabilityViewProps {
  auditLogs: AuditLog[];
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({ auditLogs }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('Overview');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpandLog = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const tabsList = [
    'Overview', 'Health & Metrics', 'Performance & Capacity', 'Traces', 
    'Alerts', 'Audit Trail', 'Compliance & Governance', 'Data Governance', 'Data Protection'
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Observability Sub Tabs */}
      <div className="border-b border-[#DCE7F3] pb-1 overflow-x-auto flex space-x-1">
        {tabsList.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-3.5 py-2 text-xs font-bold shrink-0 border-b-2 transition-all cursor-pointer ${
              activeSubTab === tab 
                ? 'border-[#1C6DD0] text-[#1C6DD0]' 
                : 'border-transparent text-[#718096] hover:text-[#2D3748]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSubTab === 'Overview' && (
        <div className="space-y-6">
          {/* Top KPI Row 1 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">System Health</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#2D3748]">98 <span className="text-xs text-[#718096]">/ 100</span></span>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Excellent · Healthy</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Performance Score</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#2D3748]">96%</span>
                <Cpu className="h-4 w-4 text-[#2F80ED]" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Optimal Response time</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Availability</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#2D3748]">99.98%</span>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">SLA Target met</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Error Rate</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-[#2D3748]">0.12%</span>
                <AlertCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">No major crashes</span>
            </div>
          </div>

          {/* Second KPI Row 2 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Active Users</span>
              <span className="font-display text-xl font-bold text-[#2D3748] mt-1 block">14</span>
              <span className="text-[10px] text-[#718096] block">Concurrent this hour</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Active Sessions</span>
              <span className="font-display text-xl font-bold text-[#2D3748] mt-1 block">4</span>
              <span className="text-[10px] text-[#718096] block">Owner / Accountant / Staff</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Requests Per Min (RPM)</span>
              <span className="font-display text-xl font-bold text-[#2D3748] mt-1 block">24</span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Stable workload</span>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Infrastructure Grade</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-xl font-bold text-[#2F80ED]">A+</span>
                <ShieldCheck className="h-4 w-4 text-[#2F80ED]" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Cloud Run isolated environment</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* System Resources */}
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-5">
              <h3 className="font-display text-sm font-bold text-[#2D3748] mb-3">Tài nguyên hạ tầng Cloud</h3>
              <div className="space-y-3 text-xs text-[#2D3748]">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>CPU Usage</span>
                    <span>14.2%</span>
                  </div>
                  <div className="w-full bg-[#EAF4FF] h-2 rounded-full">
                    <div className="bg-[#2F80ED] h-2 rounded-full w-[14.2%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Memory Allocation (RAM)</span>
                    <span>258 MB / 512 MB (50%)</span>
                  </div>
                  <div className="w-full bg-[#EAF4FF] h-2 rounded-full">
                    <div className="bg-[#6366F1] h-2 rounded-full w-[50%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Firestore Database Read Ops</span>
                    <span>1,024 / 50,000 (Free tier)</span>
                  </div>
                  <div className="w-full bg-[#EAF4FF] h-2 rounded-full">
                    <div className="bg-emerald-500 h-2 rounded-full w-[2.1%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Container Configuration */}
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-5">
              <h3 className="font-display text-sm font-bold text-[#2D3748] mb-3">Cấu hình Ingress & Network</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                  <span className="text-[#718096]">Container Port:</span>
                  <span className="font-mono font-semibold">3000 (Strictly Proxied)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                  <span className="text-[#718096]">Nginx Routing Proxy:</span>
                  <span className="text-emerald-600 font-semibold">OK (Bound 0.0.0.0)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                  <span className="text-[#718096]">Active SSL:</span>
                  <span className="text-emerald-600 font-semibold">LetsEncrypt SSL Active</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#718096]">Region Location:</span>
                  <span className="font-mono">asia-southeast1 (Singapore)</span>
                </div>
              </div>
            </div>

            {/* Platform telemetry limits */}
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-5">
              <h3 className="font-display text-sm font-bold text-[#2D3748] mb-3">Dữ liệu bảo mật & Tuân thủ</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Mã hóa dữ liệu AES-256 kích hoạt thành công.</span>
                </div>
                <div className="flex items-center space-x-2 text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                  <Database className="h-4 w-4 shrink-0" />
                  <span>Sao lưu tự động mỗi ngày (02:00 AM) hoạt động tốt.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL SUB-TAB */}
      {(activeSubTab === 'Audit Trail' || activeSubTab === 'Overview') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[#2D3748] uppercase tracking-wider">
              {activeSubTab === 'Overview' ? 'Nhật ký kiểm toán hệ thống gần đây (Audit logs)' : 'Nhật ký kiểm toán chi tiết'}
            </h3>
            {activeSubTab === 'Overview' && (
              <span className="text-xs text-[#1C6DD0] font-semibold cursor-pointer" onClick={() => setActiveSubTab('Audit Trail')}>
                Xem tất cả nhật ký →
              </span>
            )}
          </div>

          <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                  <th className="p-3 w-5" /> {/* Expand icon column */}
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Thời gian</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Tác nhân</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Quyền</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Hành động</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Đối tượng</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Địa chỉ IP</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12 cursor-pointer"
                        onClick={() => toggleExpandLog(log.id)}
                      >
                        <td className="p-3 text-center">
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-[#718096]" /> : <ChevronDown className="h-4 w-4 text-[#718096]" />}
                        </td>
                        <td className="p-3 text-xs font-medium text-[#2D3748] whitespace-nowrap">{log.timestamp}</td>
                        <td className="p-3 text-xs font-bold text-[#2D3748]">{log.actor}</td>
                        <td className="p-3 text-xs"><Badge status="info">{log.role}</Badge></td>
                        <td className="p-3 text-xs font-mono text-[#1C6DD0] font-bold">{log.action}</td>
                        <td className="p-3 text-xs font-semibold text-[#2D3748]">{log.target}</td>
                        <td className="p-3 text-xs text-[#718096] font-mono">{log.ip}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                            log.status === 'Success' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : log.status === 'Warning' 
                                ? 'bg-amber-50 text-amber-700' 
                                : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Meta details block */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={8} className="p-4 border-b border-[#EDF2F7]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#2D3748] bg-white p-4 rounded-xl border border-[#DCE7F3] shadow-inner">
                              <div>
                                <h4 className="font-bold text-[#1C6DD0] uppercase tracking-wider text-[10px] mb-2">Thông tin Chi tiết log kỹ thuật</h4>
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-[#718096]">Request ID:</span>{' '}
                                    <span className="font-mono font-medium">{log.metadata?.requestId || 'req_auto_system'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#718096]">Sự kiện:</span>{' '}
                                    <span>{log.details}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#718096]">Trình duyệt / Client:</span>{' '}
                                    <span className="font-mono text-[11px] text-[#718096] block mt-0.5">{log.metadata?.userAgent || 'Browser client details unavailable'}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-amber-600 uppercase tracking-wider text-[10px] mb-2">Bối cảnh thay đổi dữ liệu (Context Diff)</h4>
                                <div className="space-y-1.5 font-mono text-[11px] bg-slate-900 text-white p-3 rounded-lg overflow-x-auto">
                                  <div>
                                    <span className="text-[#94A3B8]">- TRƯỚC:</span> {log.metadata?.before}
                                  </div>
                                  <div>
                                    <span className="text-emerald-400">+ SAU:</span> {log.metadata?.after}
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8] mt-1.5 border-t border-slate-800 pt-1.5">
                                    Status Check Code: SEC_AUDIT_VERIFIED
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab !== 'Overview' && activeSubTab !== 'Audit Trail' && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#DCE7F3] bg-white">
          <FileText className="h-10 w-10 text-[#94A3B8] mb-2" />
          <h3 className="font-display text-sm font-bold text-[#2D3748]">Mục {activeSubTab}</h3>
          <p className="text-xs text-[#718096] max-w-xs mt-1">Các cổng giám sát và số liệu chi tiết tự động thu thập từ microservices đang được đồng bộ hóa.</p>
        </div>
      )}
    </div>
  );
};
