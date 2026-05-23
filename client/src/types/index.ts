export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiration: string;
}

export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  phone2?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  vehicleCount: number;
}

export interface Vehicle {
  id: number;
  customerId: number;
  customerName: string;
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  vin?: string;
  notes?: string;
  createdAt: string;
  repairOrderCount?: number;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  defaultPrice: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: number;
  itemCode: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
  isLowStock: boolean;
}

export interface RepairOrderService {
  id: number;
  serviceId: number;
  serviceName: string;
  price: number;
  notes?: string;
}

export interface RepairOrderPart {
  id: number;
  inventoryItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: number;
  repairOrderId: number;
  orderCode?: string;
  customerName?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  paidAt: string;
}

export interface RepairOrder {
  id: number;
  orderCode: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleMakeModel: string;
  problemDescription: string;
  status: string;
  discountPercentage: number;
  totalServicesAmount: number;
  totalPartsAmount: number;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  services: RepairOrderService[];
  parts: RepairOrderPart[];
  payments: Payment[];
}

export interface DashboardData {
  todayOrders: number;
  activeOrders: number;
  todayRevenue: number;
  totalOutstanding: number;
  lowStockItems: number;
  totalCustomers: number;
  recentOrders: RepairOrder[];
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  outstandingBalance: number;
  paymentBreakdown: { method: string; amount: number; count: number }[];
}
