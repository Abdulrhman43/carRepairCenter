import { useEffect, useState } from 'react';
import {
  Wrench, Users, TrendingUp, AlertTriangle,
  Clock, CheckCircle, Package, Car,
} from 'lucide-react';
import api from '../../services/api';
import type { DashboardData, RepairOrder } from '../../types';

const statusMap: Record<string, { label: string; color: string; dotColor: string; icon: typeof Clock }> = {
  Waiting:    { label: 'في الانتظار',  color: 'var(--color-info)',    dotColor: 'var(--color-info)',    icon: Clock },
  InProgress: { label: 'قيد التنفيذ',  color: 'var(--color-warning)', dotColor: 'var(--color-warning)', icon: Wrench },
  Done:       { label: 'مكتمل',        color: 'var(--color-success)', dotColor: 'var(--color-success)', icon: CheckCircle },
  Delivered:  { label: 'تم التسليم',   color: 'var(--text-muted)',    dotColor: 'var(--text-muted)',    icon: Package },
};

const formatCurrency = (val: number) => `${val.toLocaleString('ar-EG')} ج.م`;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
      <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      جاري التحميل...
    </div>
  );
  if (!data) return <div className="text-center p-4" style={{ color: 'var(--color-danger)' }}>حدث خطأ في تحميل البيانات</div>;

  const summaryCards = [
    { label: 'أوامر اليوم', value: data.todayOrders, icon: Car, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { label: 'أوامر نشطة', value: data.activeOrders, icon: Wrench, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { label: 'إيرادات اليوم', value: formatCurrency(data.todayRevenue), icon: TrendingUp, gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { label: 'رصيد معلق', value: formatCurrency(data.totalOutstanding), icon: AlertTriangle, gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
    { label: 'مخزون منخفض', value: data.lowStockItems, icon: Package, gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { label: 'إجمالي العملاء', value: data.totalCustomers, icon: Users, gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>لوحة التحكم</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
        {summaryCards.map((card) => (
          <div key={card.label} className="mk-card diagonal-stripe p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: card.gradient }}
            >
              <card.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mk-card">
        <div className="px-6 py-4 diagonal-stripe" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>آخر أوامر الصيانة</h3>
        </div>
        <div className="p-6">
          {data.recentOrders.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>لا توجد أوامر حتى الآن</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order: RepairOrder) => {
                const st = statusMap[order.status] || statusMap.Waiting;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-sm min-w-0">
                        <span className="font-mono-code font-semibold" style={{ color: 'var(--color-accent)' }}>{order.orderCode}</span>
                        <span className="mx-2" style={{ color: 'var(--border-color)' }}>|</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.customerName}</span>
                      </div>
                      <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                        {order.vehiclePlate} - {order.vehicleMakeModel}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-semibold font-mono-code currency" style={{ color: 'var(--text-primary)' }}>
                        {order.totalAmount.toLocaleString('ar-EG')}
                      </span>
                      <span
                        className="mk-badge"
                        style={{ background: `color-mix(in srgb, ${st.color} 12%, transparent)`, color: st.color }}
                      >
                        <span className="status-dot" style={{ background: st.dotColor }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
