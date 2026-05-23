import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, X } from 'lucide-react';
import api from '../../services/api';
import type { Service } from '../../types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const fetchServices = () => {
    setLoading(true);
    api.get<Service[]>(`/services?search=${search}`)
      .then((res) => { setServices(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchServices, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, defaultPrice: parseFloat(defaultPrice), isActive };
    try {
      if (selectedServiceId) await api.put(`/services/${selectedServiceId}`, payload);
      else await api.post('/services', payload);
      resetForm(); setIsOpen(false); fetchServices();
    } catch { alert('خطأ في حفظ الخدمة'); }
  };

  const handleEdit = (s: Service) => {
    setSelectedServiceId(s.id); setName(s.name); setDefaultPrice(s.defaultPrice.toString());
    setIsActive(s.isActive); setIsOpen(true);
  };

  const resetForm = () => { setSelectedServiceId(null); setName(''); setDefaultPrice(''); setIsActive(true); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>إدارة الخدمات</h2>
        <button onClick={() => { resetForm(); setIsOpen(true); }} className="mk-btn mk-btn-primary">
          <Plus size={18} /><span>خدمة جديدة</span>
        </button>
      </div>

      <div className="mk-card p-6">
        <div className="mb-4 relative max-w-md">
          <input placeholder="بحث عن خدمة..." value={search} onChange={(e) => setSearch(e.target.value)} className="mk-input pr-10" />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead><tr><th>اسم الخدمة</th><th>السعر الافتراضي</th><th>الحالة</th><th>تعديل</th></tr></thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                    <td className="font-mono-code font-bold currency" style={{ color: 'var(--text-secondary)' }}>{s.defaultPrice.toLocaleString('ar-EG')}</td>
                    <td>
                      <span className="mk-badge" style={{ background: `color-mix(in srgb, ${s.isActive ? 'var(--color-success)' : 'var(--color-danger)'} 12%, transparent)`, color: s.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {s.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(s)} className="mk-btn mk-btn-ghost p-1.5 rounded-lg" style={{ color: 'var(--color-warning)' }}>
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-md">
            <button onClick={() => setIsOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{selectedServiceId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>اسم الخدمة</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: تغيير زيت المحرك" className="mk-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>السعر الافتراضي (ج.م)</label>
                <input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} required placeholder="250" className="mk-input" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded cursor-pointer" />
                <label htmlFor="isActive" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>الخدمة نشطة ومتاحة للاستخدام</label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="mk-btn mk-btn-secondary">إلغاء</button>
                <button type="submit" className="mk-btn mk-btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
