export type Role = "admin" | "technician" | "employee";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  avatar?: string;
  technician?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst?: string;
  website?: string;
  logo?: string;
  buildings?: { name?: string; address?: string; floors?: number }[];
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Customer {
  _id: string;
  name: string;
  company?: Company | string | null;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type ElevatorStatus = "operational" | "under-maintenance" | "breakdown" | "decommissioned";

export interface Elevator {
  _id: string;
  code: string;
  customer?: Customer | string | null;
  company?: Company | string | null;
  building?: string;
  address?: string;
  elevatorType?: string;
  capacity?: string;
  floors?: number;
  installationDate?: string;
  warrantyExpiry?: string;
  amcExpiry?: string;
  lastService?: string;
  nextService?: string;
  assignedTechnician?: Technician | string | null;
  status: ElevatorStatus;
  photos?: string[];
  documents?: { name?: string; url?: string }[];
  qrCode?: string;
  barcode?: string;
  notes?: string;
  createdAt?: string;
}

export interface Technician {
  _id: string;
  name: string;
  photo?: string;
  mobile: string;
  email?: string;
  address?: string;
  joiningDate?: string;
  monthlySalary?: number;
  performanceRating?: number;
  skills?: string[];
  isActive?: boolean;
  createdAt?: string;
}

export type ServiceStatus = "scheduled" | "in-progress" | "completed" | "pending" | "cancelled";

export interface PartUsed {
  name?: string;
  quantity?: number;
  cost?: number;
}

export interface Service {
  _id: string;
  serviceNumber: string;
  customer?: Customer | string | null;
  company?: Company | string | null;
  elevator?: Elevator | string | null;
  complaint?: string;
  serviceType?: string;
  visitDate: string;
  visitTime?: string;
  technician?: Technician | string | null;
  workDone?: string;
  partsUsed?: PartUsed[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  customerSignature?: string;
  remarks?: string;
  status: ServiceStatus;
  durationMinutes?: number;
  cost?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";
  nextVisit?: string;
  createdAt?: string;
}

export interface Salary {
  _id: string;
  technician?: Technician | string | null;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  advanceDeducted: number;
  netPayable: number;
  amountPaid: number;
  status: "pending" | "partial" | "paid";
  paidDate?: string;
  paymentMethod?: string;
  remarks?: string;
  createdAt?: string;
}

export interface AdvancePayment {
  _id: string;
  technician?: Technician | string | null;
  amount: number;
  date: string;
  reason?: string;
  status: "outstanding" | "settled";
  createdAt?: string;
}

export interface Attendance {
  _id: string;
  technician?: Technician | string | null;
  date: string;
  status: "present" | "absent" | "half-day" | "leave" | "holiday";
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer?: Customer | string | null;
  company?: Company | string | null;
  service?: Service | string | null;
  items: InvoiceItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: "draft" | "sent" | "unpaid" | "partial" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message?: string;
  type: string;
  severity: "info" | "warning" | "critical";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  user?: { name?: string; role?: string } | null;
  action: string;
  entity?: string;
  description?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user?: { name?: string; role?: string } | null;
  method: string;
  path: string;
  entity?: string;
  ip?: string;
  userAgent?: string;
  statusCode: number;
  createdAt: string;
}

export interface Settings {
  _id?: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGst?: string;
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  amcReminderDays: number;
  warrantyReminderDays: number;
  serviceReminderDays: number;
  invoicePrefix: string;
  invoiceFooter: string;
  theme: "light" | "dark" | "system";
}

export interface ListResponse<T> {
  success: boolean;
  results: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface ItemResponse<T> {
  success: boolean;
  data: T;
}
