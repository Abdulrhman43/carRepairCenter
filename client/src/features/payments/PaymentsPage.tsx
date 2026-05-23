import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import type { Payment } from '../../types';

const methodMap: Record<string, string> = {
  Cash: 'نقدي',
  Visa: 'فيزا / كارت',
  VodafoneCash: 'فودافون كاش',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    setLoading(true);
    api.get<Payment[]>(`/payments?search=${search}`)
      .then((res) => {
        setPayments(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>سجل المدفوعات والتحصيلات</h2>
      </div>

      <div className="mk-card p-6">
        <div className="mb-4 relative max-w-md">
          <input
            placeholder="بحث برقم الإيصال أو الملاحظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mk-input pr-10"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead>
                <tr>
                  <th>رقم الإيصال</th>
                  <th>اسم العميل</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>رقم الطلب المرتبط</th>
                  <th>التاريخ</th>
                  <th>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{p.id}</td>
                    <td className="font-semibold">{p.customerName || '-'}</td>
                    <td className="font-mono-code font-bold currency" style={{ color: 'var(--color-success)' }}>{p.amount.toLocaleString('ar-EG')}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{methodMap[p.paymentMethod] || p.paymentMethod}</td>
                    <td className="font-mono-code" style={{ color: 'var(--text-secondary)' }}>{p.orderCode || '-'}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(p.paidAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="max-w-[200px] truncate text-xs" style={{ color: 'var(--text-muted)' }} title={p.notes}>{p.notes || '-'}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>لا توجد مدفوعات مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
