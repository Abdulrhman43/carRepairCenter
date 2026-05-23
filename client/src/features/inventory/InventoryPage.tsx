import { useEffect, useState } from 'react';
import { Plus, Edit2, AlertTriangle, Search, X } from 'lucide-react';
import api from '../../services/api';
import type { InventoryItem } from '../../types';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [unit, setUnit] = useState('قطعة');
  const [isActive, setIsActive] = useState(true);

  const fetchItems = () => {
    setLoading(true);
    api.get<InventoryItem[]>(`/inventory?search=${search}`)
      .then((res) => { setItems(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, category,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      minStockLevel: parseInt(minStockLevel),
      unit, isActive,
    };
    try {
      if (selectedItemId) await api.put(`/inventory/${selectedItemId}`, payload);
      else await api.post('/inventory', payload);
      setIsOpen(false); fetchItems();
    } catch { alert('خطأ في حفظ قطعة الغيار'); }
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItemId(item.id); setName(item.name); setCategory(item.category || '');
    setQuantity(item.quantity.toString()); setUnitPrice(item.unitPrice.toString());
    setMinStockLevel(item.minStockLevel.toString()); setUnit(item.unit);
    setIsActive(item.isActive); setIsOpen(true);
  };

  const resetForm = () => {
    setSelectedItemId(null); setName(''); setCategory(''); setQuantity('');
    setUnitPrice(''); setMinStockLevel(''); setUnit('قطعة'); setIsActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>مستودع قطع الغيار</h2>
        <button onClick={() => { resetForm(); setIsOpen(true); }} className="mk-btn mk-btn-primary">
          <Plus size={18} /><span>إضافة قطعة غيار</span>
        </button>
      </div>

      <div className="mk-card p-6">
        <div className="mb-4 relative max-w-md">
          <input placeholder="بحث بالاسم أو الكود..." value={search} onChange={(e) => setSearch(e.target.value)} className="mk-input pr-10" />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead><tr><th>الكود</th><th>الاسم</th><th>الفئة</th><th>الكمية الحالية</th><th>الوحدة</th><th>سعر البيع</th><th>الحد الأدنى</th><th>الحالة</th><th>تعديل</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{item.itemCode}</td>
                    <td className="font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.isLowStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--color-danger)' }}>
                            <AlertTriangle size={10} /><span>مخزون منخفض</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.category || '-'}</td>
                    <td className="font-semibold" style={{ color: item.isLowStock ? 'var(--color-danger)' : 'var(--text-primary)' }}>{item.quantity}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.unit}</td>
                    <td className="font-mono-code font-bold currency" style={{ color: 'var(--text-primary)' }}>{item.unitPrice.toLocaleString('ar-EG')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.minStockLevel}</td>
                    <td>
                      <span className="mk-badge" style={{ background: `color-mix(in srgb, ${item.isActive ? 'var(--color-success)' : 'var(--color-danger)'} 12%, transparent)`, color: item.isActive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {item.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEdit(item)} className="mk-btn mk-btn-ghost p-1.5 rounded-lg" style={{ color: 'var(--color-warning)' }}>
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

      {/* Modal */}
      {isOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-lg">
            <button onClick={() => setIsOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{selectedItemId ? 'تعديل قطعة الغيار' : 'إضافة قطعة غيار جديدة'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الاسم</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="mk-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الفئة</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="مثال: زيوت، فلاتر، فرامل" className="mk-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الكمية الابتدائية</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="mk-input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الوحدة</label>
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} required className="mk-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>سعر البيع للعميل (ج.م)</label>
                  <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required className="mk-input" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الحد الأدنى للتنبيه</label>
                  <input type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} required className="mk-input" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded cursor-pointer" />
                <label htmlFor="isActive" className="text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>نشط ومتاح للاستخدام</label>
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
