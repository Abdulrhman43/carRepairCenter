import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Eye, X } from 'lucide-react';
import api from '../../services/api';
import type { Customer, Vehicle } from '../../types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isVehOpen, setIsVehOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [vehNotes, setVehNotes] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    api.get<Customer[]>(`/customers?search=${search}`)
      .then((res) => { setCustomers(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [search]);

  const saveCustomer = async (addCarAfter: boolean) => {
    const payload = { name, phone, phone2, address, notes };
    try {
      let cust = selectedCustomer;
      if (selectedCustomerId) {
        await api.put(`/customers/${selectedCustomerId}`, payload);
        cust = customers.find(c => c.id === selectedCustomerId) || null;
      } else {
        const res = await api.post<Customer>('/customers', payload);
        cust = res.data;
      }
      resetForm(); setIsAddOpen(false); fetchCustomers();
      if (addCarAfter && cust) {
        setSelectedCustomer(cust);
        resetVehForm();
        setIsVehOpen(true);
      }
    } catch { alert('خطأ في حفظ بيانات العميل'); }
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCustomer(false);
  };

  const handleEdit = (c: Customer) => {
    setSelectedCustomerId(c.id); setName(c.name); setPhone(c.phone);
    setPhone2(c.phone2 || ''); setAddress(c.address || ''); setNotes(c.notes || '');
    setIsAddOpen(true);
  };

  const handleView = async (c: Customer) => {
    setSelectedCustomer(c);
    try {
      const vRes = await api.get<Vehicle[]>(`/vehicles?customerId=${c.id}`);
      setCustomerVehicles(vRes.data); setIsViewOpen(true);
    } catch { alert('خطأ في تحميل مركبات العميل'); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await api.post('/vehicles', {
        customerId: selectedCustomer.id, plateNumber, make, model,
        year: year ? parseInt(year) : null, color, vin, notes: vehNotes,
      });
      setIsVehOpen(false);
      const vRes = await api.get<Vehicle[]>(`/vehicles?customerId=${selectedCustomer.id}`);
      setCustomerVehicles(vRes.data || []); fetchCustomers();
    } catch {
      try {
        const vRes = await api.get<Vehicle[]>(`/vehicles?customerId=${selectedCustomer.id}`);
        setCustomerVehicles(vRes.data || []);
      } catch {}
      fetchCustomers();
    }
  };

  const resetForm = () => { setSelectedCustomerId(null); setName(''); setPhone(''); setPhone2(''); setAddress(''); setNotes(''); };
  const resetVehForm = () => { setPlateNumber(''); setMake(''); setModel(''); setYear(''); setColor(''); setVin(''); setVehNotes(''); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>إدارة العملاء</h2>
        <button onClick={() => { resetForm(); setIsAddOpen(true); }} className="mk-btn mk-btn-primary">
          <Plus size={18} /><span>عميل جديد</span>
        </button>
      </div>

      <div className="mk-card p-6">
        <div className="mb-4 relative max-w-md">
          <input placeholder="بحث بالاسم أو رقم الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="mk-input pr-10" />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead>
                <tr>
                  <th>كود العميل</th><th>الاسم</th><th>الهاتف</th><th>العنوان</th><th>عدد السيارات</th><th>خيارات</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono-code" style={{ color: 'var(--color-accent)' }}>{c.customerCode}</td>
                    <td className="font-semibold">{c.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.address || '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.vehicleCount}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleView(c)} className="mk-btn mk-btn-ghost p-1.5 rounded-lg" style={{ color: 'var(--color-info)' }}><Eye size={16} /></button>
                        <button onClick={() => handleEdit(c)} className="mk-btn mk-btn-ghost p-1.5 rounded-lg" style={{ color: 'var(--color-warning)' }}><Edit2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      {isAddOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-lg">
            <button onClick={() => setIsAddOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              {selectedCustomerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            </h3>
            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>الاسم بالكامل</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="mk-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>رقم الهاتف الأساسي</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mk-input" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>رقم الهاتف الإضافي</label>
                  <input value={phone2} onChange={(e) => setPhone2(e.target.value)} className="mk-input" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>العنوان</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="mk-input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ملاحظات</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mk-input h-20" style={{ resize: 'none' }} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddOpen(false)} className="mk-btn mk-btn-secondary">إلغاء</button>
                <button type="button" onClick={(e) => {
                  const form = e.currentTarget.closest('form');
                  if (form && form.reportValidity()) saveCustomer(true);
                }} className="mk-btn" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>حفظ وإضافة سيارة</button>
                <button type="submit" className="mk-btn mk-btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer View Modal */}
      {isViewOpen && selectedCustomer && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsViewOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>تفاصيل العميل: {selectedCustomer.name}</h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl mb-6" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>كود العميل:</span>
                <p className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{selectedCustomer.customerCode}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>الهاتف:</span>
                <p style={{ color: 'var(--text-primary)' }}>{selectedCustomer.phone}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>العنوان:</span>
                <p style={{ color: 'var(--text-primary)' }}>{selectedCustomer.address || '-'}</p>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ملاحظات:</span>
                <p style={{ color: 'var(--text-primary)' }}>{selectedCustomer.notes || '-'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-display font-bold" style={{ color: 'var(--text-primary)' }}>السيارات المسجلة</h4>
                <button onClick={() => { resetVehForm(); setIsVehOpen(true); }} className="mk-btn mk-btn-ghost text-xs" style={{ color: 'var(--color-accent)' }}>إضافة سيارة</button>
              </div>
              {customerVehicles.length === 0 ? (
                <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>لا توجد سيارات مسجلة لهذا العميل</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customerVehicles.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.make} - {v.model}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono-code font-bold" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>{v.plateNumber}</span>
                      </div>
                      <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <p>سنة الصنع: {v.year || '-'}</p>
                        <p>اللون: {v.color || '-'}</p>
                        <p>VIN: {v.vin || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-6">
              <button onClick={() => setIsViewOpen(false)} className="mk-btn mk-btn-secondary">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isVehOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-lg">
            <button onClick={() => setIsVehOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>إضافة سيارة جديدة</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
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
                <button type="button" onClick={() => setIsVehOpen(false)} className="mk-btn mk-btn-secondary">إلغاء</button>
                <button type="submit" className="mk-btn mk-btn-primary">إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
