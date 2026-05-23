import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Eye, Play, CheckCircle, PackageCheck, Printer, Tag, Settings2, X } from 'lucide-react';
import api from '../../services/api';
import type { RepairOrder, Customer, Vehicle, Service, InventoryItem } from '../../types';

const statusMap: Record<string, { label: string; color: string; dotColor: string }> = {
  Waiting:    { label: 'في الانتظار', color: 'var(--color-info)',    dotColor: 'var(--color-info)' },
  InProgress: { label: 'قيد التنفيذ', color: 'var(--color-warning)', dotColor: 'var(--color-warning)' },
  Done:       { label: 'مكتمل',       color: 'var(--color-success)', dotColor: 'var(--color-success)' },
  Delivered:  { label: 'تم التسليم',  color: 'var(--text-muted)',    dotColor: 'var(--text-muted)' },
};

const formatCurrency = (val: number) => `${val.toLocaleString('ar-EG')} ج.م`;

export default function RepairOrdersPage() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Create Order Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');

  // Detail/Edit Workspace Dialog state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);

  // Services Catalog & Inventory list
  const [services, setServices] = useState<Service[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // Add service to order
  const [serviceIdToAdd, setServiceIdToAdd] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  
  // Add part to order
  const [partIdToAdd, setPartIdToAdd] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partPrice, setPartPrice] = useState('');

  // Payment Add states
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const url = `/repairorders?status=${statusFilter}&search=${search}`;
    api.get<RepairOrder[]>(url)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, search]);

  // Lightweight background refresh for the orders list (no loading state)
  const refreshOrdersInBackground = useCallback(() => {
    const url = `/repairorders?status=${statusFilter}&search=${search}`;
    api.get<RepairOrder[]>(url)
      .then((res) => setOrders(res.data))
      .catch(() => {});
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [statusFilter, search]);

  useEffect(() => {
    api.get<Customer[]>('/customers').then((res) => setCustomers(res.data));
    api.get<Service[]>('/services?activeOnly=true').then((res) => setServices(res.data));
    api.get<InventoryItem[]>('/inventory').then((res) => setInventoryItems(res.data));
  }, []);

  const handleCustomerChange = async (cid: string) => {
    setSelectedCustomerId(cid);
    setSelectedVehicleId('');
    if (cid) {
      const res = await api.get<Vehicle[]>(`/vehicles?customerId=${cid}`);
      setVehicles(res.data);
    } else {
      setVehicles([]);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerId: parseInt(selectedCustomerId),
      vehicleId: parseInt(selectedVehicleId),
      problemDescription,
      notes,
      discountPercentage: parseFloat(discountPercentage) || 0,
    };
    try {
      await api.post('/repairorders', payload);
      setIsCreateOpen(false);
      fetchOrders();
      resetCreateForm();
    } catch {
      alert('خطأ في إنشاء أمر الصيانة');
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setProblemDescription('');
    setNotes('');
    setDiscountPercentage('0');
  };

  const handleViewDetails = async (orderId: number) => {
    try {
      const res = await api.get<RepairOrder>(`/repairorders/${orderId}`);
      setSelectedOrder(res.data);
      setIsDetailOpen(true);
    } catch {
      alert('خطأ في تحميل تفاصيل أمر الصيانة');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      await api.patch(`/repairorders/${selectedOrder.id}/status`, { status: newStatus });
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في تحديث الحالة');
    }
  };

  const handleAddService = async () => {
    if (!selectedOrder || !serviceIdToAdd) return;
    const svc = services.find((s) => s.id === parseInt(serviceIdToAdd));
    if (!svc) return;
    try {
      await api.post(`/repairorders/${selectedOrder.id}/services`, {
        serviceId: svc.id,
        price: parseFloat(servicePrice) || svc.defaultPrice,
      });
      setServiceIdToAdd('');
      setServicePrice('');
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في إضافة الخدمة');
    }
  };

  const handleRemoveService = async (serviceLineId: number) => {
    if (!selectedOrder) return;
    try {
      await api.delete(`/repairorders/${selectedOrder.id}/services/${serviceLineId}`);
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في حذف الخدمة');
    }
  };

  const handleAddPart = async () => {
    if (!selectedOrder || !partIdToAdd) return;
    const part = inventoryItems.find((i) => i.id === parseInt(partIdToAdd));
    if (!part) return;
    try {
      const res = await api.post(`/repairorders/${selectedOrder.id}/parts`, {
        inventoryItemId: part.id,
        quantity: parseInt(partQty),
        unitPrice: partPrice ? parseFloat(partPrice) : part.unitPrice,
      });
      if (res.data.warning) {
        alert(res.data.warning);
      }
      setPartIdToAdd('');
      setPartQty('1');
      setPartPrice('');
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في إضافة قطعة الغيار');
    }
  };

  const handleRemovePart = async (partLineId: number) => {
    if (!selectedOrder) return;
    try {
      await api.delete(`/repairorders/${selectedOrder.id}/parts/${partLineId}`);
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في حذف قطعة الغيار');
    }
  };

  const handleAddPayment = async () => {
    if (!selectedOrder || !payAmount) return;
    try {
      await api.post('/payments', {
        repairOrderId: selectedOrder.id,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        notes: payNotes,
      });
      setPayAmount('');
      setPayNotes('');
      handleViewDetails(selectedOrder.id);
      refreshOrdersInBackground();
    } catch {
      alert('خطأ في تسجيل الدفعة');
    }
  };

  // Debounce discount changes to avoid API call on every keystroke
  const discountTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleApplyDiscount = (perc: string) => {
    if (!selectedOrder) return;
    const numPerc = parseFloat(perc) || 0;
    // Optimistic UI update
    setSelectedOrder({ ...selectedOrder, discountPercentage: numPerc });
    clearTimeout(discountTimerRef.current);
    discountTimerRef.current = setTimeout(async () => {
      try {
        await api.patch(`/repairorders/${selectedOrder.id}/discount`, numPerc, {
          headers: { 'Content-Type': 'application/json' },
        });
        handleViewDetails(selectedOrder.id);
        refreshOrdersInBackground();
      } catch {
        alert('خطأ في تطبيق الخصم');
      }
    }, 500);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>أوامر الصيانة</h2>
        <button
          onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
          className="mk-btn mk-btn-primary"
        >
          <Plus size={18} />
          <span>أمر صيانة جديد</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center no-print">
        <div className="relative max-w-xs flex-1">
          <input
            placeholder="بحث برقم الأمر أو لوحة السيارة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mk-input pr-10"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mk-select max-w-[200px]"
        >
          <option value="">جميع الحالات</option>
          <option value="Waiting">في الانتظار</option>
          <option value="InProgress">قيد التنفيذ</option>
          <option value="Done">مكتمل</option>
          <option value="Delivered">تم التسليم</option>
        </select>
      </div>

      <div className="mk-card p-6 no-print">
        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mk-table">
              <thead>
                <tr>
                  <th>رقم الأمر</th>
                  <th>العميل</th>
                  <th>رقم اللوحة</th>
                  <th>السيارة</th>
                  <th>المشكلة</th>
                  <th>الحالة</th>
                  <th>المطلوب</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = statusMap[o.status] || { label: o.status, color: 'var(--text-muted)', dotColor: 'transparent' };
                  return (
                    <tr key={o.id}>
                      <td className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{o.orderCode}</td>
                      <td className="font-semibold">{o.customerName}</td>
                      <td className="font-mono-code">{o.vehiclePlate}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{o.vehicleMakeModel}</td>
                      <td className="max-w-[150px] truncate" style={{ color: 'var(--text-muted)' }} title={o.problemDescription}>{o.problemDescription}</td>
                      <td>
                        <span className="mk-badge" style={{ background: `color-mix(in srgb, ${st.color} 12%, transparent)`, color: st.color }}>
                          {st.dotColor !== 'transparent' && <span className="status-dot" style={{ background: st.dotColor }} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="font-semibold currency">{o.remainingAmount.toLocaleString('ar-EG')}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <button
                          onClick={() => handleViewDetails(o.id)}
                          className="mk-btn mk-btn-ghost text-xs p-1.5 gap-1"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          <Eye size={14} />
                          <span>إدارة</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="mk-modal-overlay">
          <div className="mk-modal max-w-lg">
            <button onClick={() => setIsCreateOpen(false)} className="absolute left-4 top-4 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
            <h3 className="text-lg font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>فتح أمر صيانة جديد</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>العميل</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="mk-select"
                >
                  <option value="">اختر العميل</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>السيارة</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                  disabled={!selectedCustomerId}
                  className="mk-select disabled:opacity-50"
                >
                  <option value="">اختر السيارة</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.make} - {v.model} (لوحة: {v.plateNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>وصف الشكوى والمشكلة</label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  required
                  placeholder="صف العطل أو المطلوب عمله بالتفصيل..."
                  className="mk-input h-24"
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>نسبة الخصم المبدئية (%)</label>
                <input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="mk-input"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mk-input h-16"
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="mk-btn mk-btn-secondary">
                  إلغاء
                </button>
                <button type="submit" className="mk-btn mk-btn-primary">
                  فتح الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Order Details Workspace Overlay */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 md:px-8 py-4 no-print sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-4">
              <span className="text-lg md:text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>أمر صيانة: <span className="font-mono-code" style={{ color: 'var(--color-accent)' }}>{selectedOrder.orderCode}</span></span>
              <span
                className="mk-badge"
                style={{ background: `color-mix(in srgb, ${statusMap[selectedOrder.status]?.color || 'var(--text-muted)'} 12%, transparent)`, color: statusMap[selectedOrder.status]?.color || 'var(--text-muted)' }}
              >
                {statusMap[selectedOrder.status]?.dotColor !== 'transparent' && <span className="status-dot" style={{ background: statusMap[selectedOrder.status]?.dotColor }} />}
                {statusMap[selectedOrder.status]?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={printInvoice} className="mk-btn mk-btn-ghost text-xs hidden sm:flex">
                <Printer size={16} />
                <span>طباعة</span>
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="mk-btn mk-btn-secondary text-xs px-3 py-1.5">
                <X size={16} className="sm:hidden" />
                <span className="hidden sm:inline">إغلاق</span>
              </button>
            </div>
          </div>

          <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 no-print max-w-7xl mx-auto w-full">
            {/* Left Column: Info & Workflow Actions */}
            <div className="space-y-6">
              <div className="mk-card diagonal-stripe p-5 space-y-4">
                <h3 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>بيانات العميل والمركبة</h3>
                <div className="space-y-2 text-sm">
                  <p><span style={{ color: 'var(--text-muted)' }}>العميل:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerName}</span></p>
                  <p><span style={{ color: 'var(--text-muted)' }}>الهاتف:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.customerPhone}</span></p>
                  <p><span style={{ color: 'var(--text-muted)' }}>السيارة:</span> <span style={{ color: 'var(--text-primary)' }}>{selectedOrder.vehicleMakeModel}</span></p>
                  <p><span style={{ color: 'var(--text-muted)' }}>رقم اللوحة:</span> <span className="font-mono-code font-bold" style={{ color: 'var(--color-accent)' }}>{selectedOrder.vehiclePlate}</span></p>
                  <div className="pt-2 border-t mt-2" style={{ borderTopColor: 'var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)' }} className="mb-1">المشكلة / الشكوى:</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.problemDescription}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>تحديث حالة العمل</h4>
                  <div className="flex flex-col gap-2">
                    {selectedOrder.status === 'Waiting' && (
                      <button onClick={() => handleStatusUpdate('InProgress')} className="mk-btn w-full" style={{ background: 'var(--color-warning)', color: 'white' }}>
                        <Play size={14} /> بدء الصيانة
                      </button>
                    )}
                    {selectedOrder.status === 'InProgress' && (
                      <button onClick={() => handleStatusUpdate('Done')} className="mk-btn w-full" style={{ background: 'var(--color-success)', color: 'white' }}>
                        <CheckCircle size={14} /> إكمال الصيانة وتجهيز الفاتورة
                      </button>
                    )}
                    {selectedOrder.status === 'Done' && (
                      <button onClick={() => handleStatusUpdate('Delivered')} className="mk-btn mk-btn-primary w-full">
                        <PackageCheck size={14} /> تسليم السيارة للعميل
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payments Panel */}
              <div className="mk-card p-5 space-y-4">
                <h3 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>تسجيل دفعة / مبلغ مالي</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>المبلغ المدفوع (ج.م)</label>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="mk-input" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>طريقة الدفع</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="mk-select">
                      <option value="Cash">نقدي</option>
                      <option value="Visa">فيزا / كارت</option>
                      <option value="VodafoneCash">فودافون كاش</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>ملاحظات</label>
                    <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} className="mk-input" />
                  </div>
                  <button onClick={handleAddPayment} className="mk-btn mk-btn-primary w-full mt-2">
                    تسجيل الدفعة
                  </button>
                </div>
              </div>
            </div>

            {/* Middle/Right Column: Services & Parts Input */}
            <div className="space-y-6 lg:col-span-2">
              <div className="mk-card p-6 space-y-8">
                {/* Services Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Settings2 size={18} style={{ color: 'var(--color-accent)' }} /> الخدمات المطلوبة
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select value={serviceIdToAdd} onChange={(e) => setServiceIdToAdd(e.target.value)} className="mk-select flex-1">
                      <option value="">اختر الخدمة من الدليل...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (افتراضي: {formatCurrency(s.defaultPrice)})
                        </option>
                      ))}
                    </select>
                    <input placeholder="السعر" type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} className="mk-input w-full sm:w-32" />
                    <button onClick={handleAddService} className="mk-btn mk-btn-primary shrink-0">إضافة</button>
                  </div>

                  <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                    <table className="mk-table text-xs">
                      <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr><th className="px-4">الخدمة</th><th>السعر المتفق عليه</th><th className="px-4 text-left">إجراء</th></tr>
                      </thead>
                      <tbody>
                        {selectedOrder.services.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>لم يتم إضافة خدمات</td></tr>
                        ) : (
                          selectedOrder.services.map((s) => (
                            <tr key={s.id}>
                              <td className="px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{s.serviceName}</td>
                              <td className="font-mono-code currency" style={{ color: 'var(--text-primary)' }}>{s.price.toLocaleString('ar-EG')}</td>
                              <td className="px-4 text-left">
                                <button onClick={() => handleRemoveService(s.id)} className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-danger)' }}>حذف</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Parts Section */}
                <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <h3 className="text-base font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <PackageCheck size={18} style={{ color: 'var(--color-accent)' }} /> قطع الغيار المستهلكة
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select value={partIdToAdd} onChange={(e) => setPartIdToAdd(e.target.value)} className="mk-select flex-1">
                      <option value="">اختر قطعة الغيار من المستودع...</option>
                      {inventoryItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.quantity} {item.unit} متاح - {formatCurrency(item.unitPrice)})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input placeholder="الكمية" type="number" value={partQty} onChange={(e) => setPartQty(e.target.value)} className="mk-input w-20" />
                      <input placeholder="السعر" type="number" value={partPrice} onChange={(e) => setPartPrice(e.target.value)} className="mk-input w-28" />
                    </div>
                    <button onClick={handleAddPart} className="mk-btn mk-btn-primary shrink-0">إضافة</button>
                  </div>

                  <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                    <table className="mk-table text-xs">
                      <thead style={{ background: 'var(--bg-secondary)' }}>
                        <tr><th className="px-4">القطعة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th className="px-4 text-left">إجراء</th></tr>
                      </thead>
                      <tbody>
                        {selectedOrder.parts.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-4" style={{ color: 'var(--text-muted)' }}>لم يتم استهلاك قطع غيار</td></tr>
                        ) : (
                          selectedOrder.parts.map((p) => (
                            <tr key={p.id}>
                              <td className="px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{p.itemName}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{p.quantity}</td>
                              <td className="font-mono-code currency" style={{ color: 'var(--text-secondary)' }}>{p.unitPrice.toLocaleString('ar-EG')}</td>
                              <td className="font-mono-code font-bold currency" style={{ color: 'var(--text-primary)' }}>{p.totalPrice.toLocaleString('ar-EG')}</td>
                              <td className="px-4 text-left">
                                <button onClick={() => handleRemovePart(p.id)} className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-danger)' }}>حذف</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>مجموع الخدمات والقطع:</span>
                    <p className="text-lg font-bold font-mono-code currency mt-1" style={{ color: 'var(--text-primary)' }}>{selectedOrder.subTotal.toLocaleString('ar-EG')}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      <span>الخصم (%):</span>
                      <Tag size={12} style={{ color: 'var(--color-warning)' }} />
                    </div>
                    <input
                      type="number"
                      value={selectedOrder.discountPercentage}
                      onChange={(e) => handleApplyDiscount(e.target.value)}
                      className="mk-input py-1 mt-1 font-mono-code font-semibold"
                      style={{ height: 'auto', width: '80px', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>المبلغ الصافي المطلـوب:</span>
                    <p className="text-xl font-bold font-mono-code currency mt-1" style={{ color: 'var(--color-success)' }}>{selectedOrder.totalAmount.toLocaleString('ar-EG')}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>حالة الدفع:</span>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>المدفوع: {formatCurrency(selectedOrder.paidAmount)}</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-danger)' }}>المتبقي: {formatCurrency(selectedOrder.remainingAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print Only Invoice Layout (Light Mode Enforced by Print CSS) */}
          <div className="print-only hidden p-10 bg-white text-black min-h-screen" dir="rtl">
            <div className="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">مكانك سيرفس لصيانة السيارات</h1>
                <p className="text-sm text-gray-600 mt-1">شارع الصيانة الرئيسي، القاهرة</p>
                <p className="text-sm font-mono-code text-gray-600">الهاتف: 01002003004 / 01102203304</p>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-800">فاتورة صيانة سيارة</h2>
                <p className="font-mono-code text-lg font-bold mt-1" style={{ color: 'var(--color-accent)' }}>رقم الفاتورة: {selectedOrder.orderCode}</p>
                <p className="text-sm font-mono-code text-gray-600 mt-1">التاريخ: {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 border-2 border-gray-200 p-4 rounded-xl mb-6">
              <div>
                <p className="font-bold text-gray-800 border-b pb-1 mb-2">بيانات العميل:</p>
                <p className="text-sm">الاسم: {selectedOrder.customerName}</p>
                <p className="text-sm font-mono-code">رقم الهاتف: {selectedOrder.customerPhone}</p>
              </div>
              <div>
                <p className="font-bold text-gray-800 border-b pb-1 mb-2">بيانات المركبة:</p>
                <p className="text-sm">السيارة: {selectedOrder.vehicleMakeModel}</p>
                <p className="text-sm font-mono-code">رقم اللوحة: {selectedOrder.vehiclePlate}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="font-bold text-gray-800 border-b pb-1">الشكوى / العطل المشخص:</p>
              <p className="mt-2 text-sm text-gray-700">{selectedOrder.problemDescription}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-1 mb-3">الخدمات والأعمال الفنية</h3>
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-700">
                    <th className="py-2 px-3">اسم الخدمة</th>
                    <th className="py-2 px-3 text-left">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.services.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2.5 px-3 text-gray-800">{s.serviceName}</td>
                      <td className="py-2.5 px-3 text-left font-mono-code font-semibold text-gray-900">{s.price.toLocaleString('ar-EG')} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder.parts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 border-b pb-1 mb-3">قطع الغيار المستهلكة</h3>
                <table className="w-full border-collapse text-right text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-700">
                      <th className="py-2 px-3">القطعة</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">سعر الوحدة</th>
                      <th className="py-2 px-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.parts.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-2.5 px-3 text-gray-800">{p.itemName}</td>
                        <td className="py-2.5 px-3 text-gray-700">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-gray-700 font-mono-code">{p.unitPrice.toLocaleString('ar-EG')} ج.م</td>
                        <td className="py-2.5 px-3 text-left font-mono-code font-semibold text-gray-900">{p.totalPrice.toLocaleString('ar-EG')} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="w-72 mr-auto space-y-2 border-t pt-4 text-sm mt-8">
              <div className="flex justify-between text-gray-700">
                <span>المجموع الفرعي:</span>
                <span className="font-mono-code">{selectedOrder.subTotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>الخصم ({selectedOrder.discountPercentage}%):</span>
                <span className="font-mono-code">{selectedOrder.discountAmount.toLocaleString('ar-EG')} - ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2 text-gray-950">
                <span>الإجمالي الكلي:</span>
                <span className="font-mono-code">{selectedOrder.totalAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>المدفوع:</span>
                <span className="font-mono-code">{selectedOrder.paidAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-red-600 border-t pt-1">
                <span>المتبقي المطلوب:</span>
                <span className="font-mono-code">{selectedOrder.remainingAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>

            <div className="flex justify-between pt-20 text-center text-sm">
              <div>
                <p className="border-t border-gray-400 w-48 pt-2">توقيع المستلم</p>
              </div>
              <div>
                <p className="border-t border-gray-400 w-48 pt-2">توقيع مركز الصيانة</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
