import { useEffect, useState } from 'react';
import { Search, Eye, X, Plus } from 'lucide-react';
import api from '../../services/api';
import type { Vehicle } from '../../types';

interface OrderHistoryItem {
  id: number;
  orderCode: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  Waiting:    { label: 'في الانتظار', color: 'var(--color-info)' },
  InProgress: { label: 'قيد التنفيذ', color: 'var(--color-warning)' },
  Done:       { label: 'مكتمل',       color: 'var(--color-success)' },
  Delivered:  { label: 'تم التسليم',  color: 'var(--text-muted)' },
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [vehNotes, setVehNotes] = useState('');

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data)).catch(() => {});
  }, []);

  const fetchVehicles = () => {
    setLoading(true);
    api.get<Vehicle[]>(`/vehicles?search=${search}`)
      .then((res) => { setVehicles(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleViewHistory = async (v: Vehicle) => {
    setSelectedVehicle(v);
    try {
      const res = await api.get<OrderHistoryItem[]>(`/vehicles/${v.id}/history`);
      setHistory(res.data || []); setIsOpen(true);
    } catch { alert('خطأ في تحميل سجل الصيانة'); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', {
        customerId: parseInt(customerId), plateNumber, make, model,
        year: year ? parseInt(year) : null, color, vin, notes: vehNotes,
      });
      setIsAddOpen(false);
      setCustomerId(''); setPlateNumber(''); setMake(''); setModel(''); setYear(''); setColor(''); setVin(''); setVehNotes('');
      fetchVehicles();
    } catch { alert('خطأ في إضافة السيارة'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>سجل المركبات</h2>
        <button onClick={() => setIsAddOpen(true)} className="mk-btn mk-btn-primary">
          <Plus size={18} /><span>إضافة سيارة</span>
        </button>
      </div>

      <div className="mk-card p-6">
        <div className="mb-4 relative max-w-md">
          <input placeholder="بحث برقم اللوحة أو الماركة..." value={search} onChange={(e) => setSearch(e.target.value)} className="mk-input pr-10" />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead><tr><th>رقم اللوحة</th><th>الماركة والموديل</th><th>سنة الصنع</th><th>اللون</th><th>المالك</th><th>سجل الصيانة</th></tr></thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td><span className="font-mono-code text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>{v.plateNumber}</span></td>
                    <td className="font-semibold">{v.make} - {v.model}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.year || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.color || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.customerName}</td>
                    <td>
                      <button onClick={() => handleViewHistory(v)} className="mk-btn mk-btn-ghost text-xs p-1.5 rounded-lg gap-1.5" style={{ color: 'var(--color-accent)' }}>
                        <Eye size={14} /><span>عرض السجل ({v.repairOrderCount || 0})</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Modal */}
      {isOpen && selectedVehicle && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setIsOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>سجل صيانة المركبة</h3>

            <div className="p-4 rounded-xl space-y-2 mb-6" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedVehicle.make} - {selectedVehicle.model} ({selectedVehicle.year || '-'})</p>
              <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <p>رقم اللوحة: <span className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{selectedVehicle.plateNumber}</span></p>
                <p>اللون: {selectedVehicle.color || '-'}</p>
                <p>المالك: {selectedVehicle.customerName}</p>
              </div>
            </div>

            <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>سجل فواتير الصيانة</h4>
            {history.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>لا توجد زيارات صيانة مسجلة</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((h) => {
                  const st = statusMap[h.status] || { label: h.status, color: 'var(--text-muted)' };
                  return (
                    <div key={h.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-sm" style={{ color: 'var(--color-accent)' }}>{h.orderCode}</span>
                          <span className="mk-badge" style={{ background: `color-mix(in srgb, ${st.color} 12%, transparent)`, color: st.color }}>
                            <span className="status-dot" style={{ background: st.color }} />{st.label}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className="text-sm font-bold currency" style={{ color: 'var(--text-primary)' }}>{h.totalAmount.toLocaleString('ar-EG')}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-6">
              <button onClick={() => setIsOpen(false)} className="mk-btn mk-btn-secondary">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-lg">
            <button onClick={() => setIsAddOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>إضافة سيارة جديدة</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>العميل المالك</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="mk-select">
                  <option value="">اختر العميل...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>رقم اللوحة</label>
                <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required placeholder="مثال: أ ب ج 1234" className="mk-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الماركة</label>
                  <input value={make} onChange={(e) => setMake(e.target.value)} required placeholder="مثال: تويوتا" className="mk-input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الموديل</label>
                  <input value={model} onChange={(e) => setModel(e.target.value)} required placeholder="مثال: كورولا" className="mk-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>سنة الصنع</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" className="mk-input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>اللون</label>
                  <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="أبيض" className="mk-input" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>VIN</label>
                <input value={vin} onChange={(e) => setVin(e.target.value)} className="mk-input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ملاحظات</label>
                <textarea value={vehNotes} onChange={(e) => setVehNotes(e.target.value)} className="mk-input h-16" style={{ resize: 'none' }} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddOpen(false)} className="mk-btn mk-btn-secondary">إلغاء</button>
                <button type="submit" className="mk-btn mk-btn-primary">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
