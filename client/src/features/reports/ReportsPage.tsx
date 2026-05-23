import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowLeftRight } from 'lucide-react';
import api from '../../services/api';
import type { DailyReport } from '../../types';

const methodMap: Record<string, string> = {
  Cash: 'نقدي',
  Visa: 'فيزا / كارت',
  VodafoneCash: 'فودافون كاش',
};

const formatCurrency = (val: number) => `${val.toLocaleString('ar-EG')} ج.م`;

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    api.get<DailyReport>(`/dashboard/report?date=${date}`)
      .then((res) => { setReport(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [date]);

  if (loading && !report) return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 style={{ color: 'var(--color-accent)' }} /> التقارير اليومية والأرباح
        </h2>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold focus:outline-none cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {report && (
        <>
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
            <div className="mk-card p-5 flex items-center gap-4 diagonal-stripe">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', color: 'var(--color-success)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>إيرادات اليوم المحدّد</span>
                <p className="text-lg font-bold font-mono-code mt-0.5" style={{ color: 'var(--color-success)' }}>{formatCurrency(report.totalRevenue)}</p>
              </div>
            </div>

            <div className="mk-card p-5 flex items-center gap-4 diagonal-stripe">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-info) 10%, transparent)', color: 'var(--color-info)' }}>
                <ArrowLeftRight size={20} />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>أوامر جديدة اليوم</span>
                <p className="text-lg font-bold font-mono-code mt-0.5" style={{ color: 'var(--text-primary)' }}>{report.totalOrders} أمر</p>
              </div>
            </div>

            <div className="mk-card p-5 flex items-center gap-4 diagonal-stripe">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>أوامر تم إكمالها اليوم</span>
                <p className="text-lg font-bold font-mono-code mt-0.5" style={{ color: 'var(--text-primary)' }}>{report.completedOrders} أمر</p>
              </div>
            </div>

            <div className="mk-card p-5 flex items-center gap-4 diagonal-stripe">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', color: 'var(--color-danger)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>إجمالي المديونيات التعلقة</span>
                <p className="text-lg font-bold font-mono-code mt-0.5" style={{ color: 'var(--color-danger)' }}>{formatCurrency(report.outstandingBalance)}</p>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Table */}
          <div className="mk-card p-6">
            <h3 className="text-lg font-display font-bold mb-4" style={{ color: 'var(--text-primary)' }}>تفاصيل طرق الدفع والتحصيلات</h3>
            {report.paymentBreakdown.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد عمليات دفع مسجلة لهذا اليوم</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="mk-table">
                  <thead><tr><th>طريقة الدفع</th><th>إجمالي المبلغ المحصّل</th><th>عدد الدفعات</th></tr></thead>
                  <tbody>
                    {report.paymentBreakdown.map((b) => (
                      <tr key={b.method}>
                        <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{methodMap[b.method] || b.method}</td>
                        <td className="font-bold font-mono-code currency" style={{ color: 'var(--color-success)' }}>{b.amount.toLocaleString('ar-EG')}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{b.count} دفعات</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
