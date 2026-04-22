export interface OwnerData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface FarmData {
  ownerId: number;
  name: string;
  location?: string;
  capacity?: number;
  loginUsername: string;
  loginPassword: string;
}

export interface FlockData {
  farmId: number;
  batchName: string;
  breed?: string;
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageAtArrivalDays?: number;
  status?: string;
  statusChangedDate?: string;
  statusNotes?: string;
  notes?: string;
}

export interface DailyEntryData {
  flockId: number;
  entryDate: string;
  deaths?: number;
  deathCause?: string;
  totalEggs?: number;
  feedConsumedKg?: number;
  waterConsumedLiters?: number;
  notes?: string;
  recordedBy?: number;
}

export interface ExpenseData {
  farmId: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier?: string;
  receiptRef?: string;
  notes?: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  search?: string;
}

export interface ExpenseSummary {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

export interface DailyRevenueEntry {
  date: string;
  salesCount: number;
  totalAmount: number;
  collectedAmount: number;
  outstanding: number;
}

export interface DailyRevenueSummary {
  daily: DailyRevenueEntry[];
}

export interface TotalRevenue {
  totalRevenue: number;
  totalCollected: number;
  outstanding: number;
  totalSales: number;
  byCustomer: Array<{ customerId: number; customerName: string; totalAmount: number; collectedAmount: number }>;
  byType: Array<{ itemType: string; grade: string; quantity: number; revenue: number }>;
}

export interface RevenueVsExpenses {
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitLossData {
  revenue: {
    total: number;
    totalCollected: number;
    outstanding: number;
    salesCount: number;
    collectionRate: number;
    customersServed: number;
    byCustomer: Array<{ name: string; amount: number }>;
    byProduct: Array<{ name: string; amount: number }>;
  };
  expenses: { byCategory: Record<string, number>; total: number };
  profit: number;
  margin: number;
}

export interface FinancialTrendPoint {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface PerBirdMetrics {
  avgBirds: number;
  revenuePerBird: number;
  expensePerBird: number;
  profitPerBird: number;
}

export interface PerEggMetrics {
  totalEggs: number;
  revenuePerEgg: number;
  costPerEgg: number;
  profitPerEgg: number;
}

export interface InventoryData {
  farmId: number;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  expiryDate?: string;
  supplier?: string;
  notes?: string;
}

export interface InventoryItem {
  id: number;
  farmId: number;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  minThreshold: number | null;
  expiryDate: string | null;
  lastUpdated: string | null;
}

export interface InventoryTransaction {
  id: number;
  inventoryId: number;
  type: string;
  quantity: number;
  date: string;
  reason: string | null;
  supplier: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string | null;
}

export interface InventoryItemWithTransactions extends InventoryItem {
  transactions: InventoryTransaction[];
}

export interface AddStockData {
  quantity: number;
  date: string;
  supplier?: string;
  cost?: number;
  expiryDate?: string;
  notes?: string;
}

export interface ReduceStockData {
  quantity: number;
  date: string;
  reason: string;
  notes?: string;
}

export interface FarmAlert {
  id: string;
  type: "low_stock" | "expiring" | "vaccination_due" | "payment_overdue" | "payment_due_today" | "payment_due_soon";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  referenceId: number;
  createdAt: string;
  isDismissed: boolean;
  actionUrl: string;
}

export interface PaymentAlert {
  type: "overdue" | "due_today" | "due_soon";
  priority: "critical" | "high" | "warning" | "info";
  saleId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  balanceDue: number;
  dueDate: string;
  daysOverdue?: number;
  daysTillDue?: number;
}

export interface VaccinationData {
  flockId: number;
  vaccineName: string;
  scheduledDate: string;
  administeredDate?: string;
  administeredBy?: string;
  dosage?: string;
  route?: string;
  batchNumber?: string;
  notes?: string;
  status?: string;
}

export interface UpcomingVaccination {
  id: number;
  flockId: number | null;
  vaccineName: string;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  batchNumber: string | null;
  dosage: string | null;
  route: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string | null;
  flockName: string;
  flockBreed: string;
  flockCurrentCount: number | null;
  daysUntilDue: number;
  flockAgeDays: number;
  vaccAgeDays: number;
}

export interface CompletedVaccination {
  id: number;
  flockId: number | null;
  vaccineName: string;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  batchNumber: string | null;
  dosage: string | null;
  route: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string | null;
  flockName: string;
}

export interface CompleteVaccinationData {
  administeredDate: string;
  administeredBy?: string;
  batchNumber?: string;
  notes?: string;
}

export interface SkipVaccinationData {
  reason: string;
  notes?: string;
  rescheduleDate?: string;
}

export interface VaccinationHistoryFilters {
  flockId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface VaccinationHistoryItem {
  id: number;
  flockId: number | null;
  vaccineName: string;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  batchNumber: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string | null;
  flockName: string;
  flockBreed: string;
}

export interface VaccinationHistoryResponse {
  items: VaccinationHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FlockVaccinationItem {
  id: number;
  flockId: number | null;
  vaccineName: string;
  scheduledDate: string;
  administeredDate: string | null;
  administeredBy: string | null;
  batchNumber: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string | null;
  vaccAgeDays: number;
}

export interface FlockVaccinationDetailed {
  flock: {
    id: number;
    batchName: string;
    breed: string;
    currentCount: number | null;
    arrivalDate: string;
    ageAtArrivalDays: number | null;
    status: string | null;
  };
  vaccinations: FlockVaccinationItem[];
  compliance: {
    total: number;
    completed: number;
    skipped: number;
    overdue: number;
    pending: number;
    rate: number;
  };
}

export interface ComplianceStats {
  total: number;
  completed: number;
  skipped: number;
  overdue: number;
  pending: number;
  rate: number;
  lastCompletedDate: string | null;
  lastCompletedVaccine: string | null;
}

export interface AddCustomVaccinationData {
  vaccineName: string;
  administeredDate: string;
  administeredBy: string;
  batchNumber?: string;
  route?: string;
  notes?: string;
}

export interface VaccinationExportItem {
  date: string;
  flock: string;
  vaccine: string;
  status: string;
  administeredBy: string;
  batchNumber: string;
  notes: string;
}

export interface FarmInfo {
  id: number;
  name: string;
  location: string | null;
}

export interface DailyReportData {
  date: string;
  farm: FarmInfo;
  flocks: {
    flockId: number;
    batchName: string;
    breed: string | null;
    currentCount: number;
    totalEggs: number;
    deaths: number;
    deathCause: string | null;
    feedConsumedKg: number;
    waterConsumedLiters: number | null;
    notes: string | null;
  }[];
  totals: {
    birds: number;
    eggsTotal: number;
    deaths: number;
    feedKg: number;
    revenue: number;
    expenses: number;
  };
  notes: string[];
}

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  farm: FarmInfo;
  dailyData: {
    date: string;
    eggs: number;
    deaths: number;
    feedKg: number;
  }[];
  weeklyTotals: {
    birds: number;
    eggs: number;
    deaths: number;
    feedKg: number;
  };
  averages: {
    eggsPerDay: number;
    mortalityRate: number;
    feedPerBird: number;
  };
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

export interface MonthlyReportData {
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  farm: FarmInfo;
  weeklyData: {
    weekStart: string;
    weekEnd: string;
    eggsTotal: number;
    deaths: number;
    feedKg: number;
    revenue: number;
    expenses: number;
  }[];
  totals: {
    birds: number;
    eggsTotal: number;
    deaths: number;
    feedKg: number;
  };
  averages: {
    eggsPerDay: number;
    productionRate: number;
  };
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
    expensesByCategory: { category: string; amount: number }[];
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    expiringSoon: number;
  };
  vaccination: {
    complianceRate: number;
    completed: number;
    total: number;
  };
}

export interface FlockReportData {
  farm: FarmInfo;
  flock: {
    id: number;
    batchName: string;
    breed: string | null;
    initialCount: number;
    currentCount: number | null;
    arrivalDate: string;
    ageAtArrivalDays: number | null;
    ageDays: number;
    status: string | null;
  };
  stats: {
    totalEggs: number;
    totalEggsA: number;
    totalEggsB: number;
    totalCracked: number;
    totalDeaths: number;
    totalFeed: number;
    mortalityRate: number;
    productionRate: number;
    feedConversionRatio: number;
    daysTracked: number;
  };
  productionCurve: {
    date: string;
    eggs: number;
    deaths: number;
    feedKg: number;
  }[];
  vaccinations: {
    total: number;
    completed: number;
    complianceRate: number;
    records: {
      vaccineName: string;
      scheduledDate: string;
      administeredDate: string | null;
      status: string | null;
    }[];
  };
}

export interface FinancialReportData {
  startDate: string;
  endDate: string;
  farm: FarmInfo;
  revenue: {
    total: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
    salesCount: number;
    byCustomer: Array<{ name: string; amount: number }>;
    byProduct: Array<{ name: string; amount: number }>;
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  profitLoss: {
    profit: number;
    margin: number;
  };
  metrics: {
    revenuePerBird: number;
    expensePerBird: number;
    profitPerBird: number;
    revenuePerEgg: number;
    costPerEgg: number;
    totalBirds: number;
    totalEggs: number;
  };
  dailyTrend: {
    date: string;
    revenue: number;
    expenses: number;
  }[];
}

export interface StatHistoryPoint {
  date: string;
  value: number;
}

export interface OwnerDashboardStats {
  totalBirds: number;
  /** Month-to-date total eggs (all owner farms). */
  totalEggsMonth: number;
  /** Eggs recorded today (all owner farms), optional detail. */
  totalEggsToday: number;
  revenueMonth: number;
  profitMonth: number;
  totalFarms: number;
  totalBirdsChange: number;
  totalEggsTrend: number;
  revenueTrend: number;
  profitTrend: number;
}

export type OwnerReportType = "summary" | "financial" | "production" | "sales";

export interface OwnerReportParams {
  type: OwnerReportType;
  startDate: string;
  endDate: string;
  farmId?: number;
}

export interface OwnerReportSummaryItem {
  label: string;
  value: string;
}

export interface OwnerReportSection {
  title: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface OwnerReportResult {
  type: OwnerReportType;
  startDate: string;
  endDate: string;
  scopeLabel: string;
  summary: OwnerReportSummaryItem[];
  columns: string[];
  rows: Record<string, string>[];
  sections: OwnerReportSection[];
}

export interface FarmOverview {
  id: number;
  name: string;
  location: string | null;
  capacity: number | null;
  isActive: number;
  totalBirds: number;
  totalFlocks: number;
  eggsToday: number;
  flocksWithEntriesToday: number;
  productionRate: number;
  mortalityRate: number;
  profitMargin: number;
  revenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  performance: "good" | "warning" | "critical";
}

export interface FarmComparisonData {
  farmId: number;
  farmName: string;
  totalBirds: number;
  avgEggsPerDay: number;
  productionRate: number;
  mortalityRate: number;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

export interface OwnerAlert {
  farmId: number;
  farmName: string;
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  referenceId: number;
  date: string;
}

export interface RecentActivity {
  id: number;
  farmId: number;
  farmName: string;
  type: "entry" | "expense" | "vaccination";
  description: string;
  date: string;
  amount?: number;
}

export interface BackupMetadata {
  version: string;
  createdAt: string;
  dbVersion: number;
  appName: string;
  stats: {
    farms: number;
    flocks: number;
    dailyEntries: number;
    expenses: number;
    vaccinations: number;
    owners: number;
    inventory: number;
  };
}

export interface BackupInfo {
  path: string;
  filename: string;
  size: number;
  createdAt: string;
  metadata: BackupMetadata | null;
}

export interface AutoBackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly";
  time: string;
  location: string;
  retention: number;
  lastBackup: string | null;
  nextBackup: string | null;
}

export interface BackupValidation {
  valid: boolean;
  metadata: BackupMetadata | null;
  error?: string;
}

export interface RestorePreview {
  backupPath: string;
  metadata: BackupMetadata | null;
}

export interface AppSettings {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  currencySymbol: "PKR" | "Rs" | "Rs.";
  numberFormat: "comma" | "dot";
  defaultEggUnit: "eggs" | "trays";
  traySize: number;
  defaultDateRange: "today" | "week" | "month";
  autoRefreshInterval: number;
  lowStockAlerts: boolean;
  vaccinationReminders: boolean;
  vaccinationReminderDays: number;
  mortalityAlerts: boolean;
  mortalityThreshold: number;
  showDashboardAlerts: boolean;
  defaultFeedBagWeight: number;
  defaultDeathCauses: string[];
  autoGenerateVaccinations: boolean;
}

export interface OwnerProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FarmProfile {
  id: number;
  ownerId: number | null;
  name: string;
  location: string | null;
  capacity: number | null;
  loginUsername: string;
  isActive: number | null;
  createdAt: string | null;
}

export interface SystemInfo {
  dbPath: string;
  dbSize: number;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
  appVersion: string;
  platform: string;
}

export interface DataExportOptions {
  startDate?: string;
  endDate?: string;
  includeFlocks?: boolean;
  includeEntries?: boolean;
  includeExpenses?: boolean;
  includeInventory?: boolean;
  includeVaccinations?: boolean;
}

export interface CustomerData {
  farmId: number;
  name: string;
  phone?: string;
  address?: string;
  businessName?: string;
  category: string;
  paymentTermsDays?: number;
  defaultPricePerEgg?: number | null;
  defaultPricePerTray?: number | null;
  notes?: string;
  isActive?: number;
}

export interface Customer {
  id: number;
  farmId: number;
  name: string;
  phone: string | null;
  address: string | null;
  businessName: string | null;
  category: string;
  paymentTermsDays: number | null;
  defaultPricePerEgg: number | null;
  defaultPricePerTray: number | null;
  notes: string | null;
  isActive: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerFilters {
  search?: string;
  category?: string;
  status?: "active" | "inactive" | "all";
}

export interface CustomerStats {
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  lastPurchaseDate: string | null;
  totalOrders: number;
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats;
}

export interface EggCategory {
  id: number;
  farmId: number;
  name: string;
  description?: string;
  defaultPrice: number;
  unit: "tray" | "dozen" | "piece" | "crate";
  isActive: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItemData {
  itemType: string;
  grade: string;
  unitType: "egg" | "tray" | "peti";
  quantity: number;
  unitPrice: number;
  totalEggs: number;
  lineTotal: number;
}

export interface SaleData {
  farmId: number;
  customerId: number | null;
  walkInCustomerName?: string;
  saleDate: string;
  dueDate?: string;
  items: SaleItemData[];
  discountType?: string;
  discountValue?: number;
  amountPaid?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface Sale {
  id: number;
  farmId: number;
  customerId: number | null;
  walkInCustomerName?: string;
  invoiceNumber: string;
  saleDate: string;
  dueDate: string | null;
  subtotal: number | null;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  totalAmount: number | null;
  paidAmount: number | null;
  balanceDue: number | null;
  paymentStatus: string | null;
  notes: string | null;
  isDeleted: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SaleWithCustomer extends Sale {
  customerName: string;
  customerPhone: string | null;
  customerBusinessName: string | null;
  walkInCustomerName?: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  itemType: string;
  grade: string;
  unitType: "egg" | "tray" | "peti";
  quantity: number | null;
  unitPrice: number | null;
  totalEggs: number | null;
  lineTotal: number | null;
}

export interface SalePayment {
  id: number;
  saleId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface SaleDetail extends Sale {
  customer: Customer | null;
  walkInCustomerName?: string;
  items: SaleItem[];
  payments: SalePayment[];
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  paymentStatus?: string;
  search?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalReceived: number;
  totalOutstanding: number;
  salesCount: number;
}

export interface RecordPaymentData {
  saleId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

export interface PaymentWithDetails {
  id: number;
  saleId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | null;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerBusinessName: string | null;
}

export interface CustomerPayment {
  id: number;
  saleId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | null;
  invoiceNumber: string;
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  paymentMethod?: string;
  search?: string;
}

export interface PaymentsSummary {
  totalReceivables: number;
  overdueAmount: number;
  overdueCount: number;
  dueThisWeek: number;
  dueThisMonth: number;
  paymentsToday: number;
}

export interface ReceivableItem {
  id: number;
  invoiceNumber: string;
  saleDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: string;
  customerId: number | null;
  customerName: string;
  customerPhone: string | null;
  customerBusinessName: string | null;
  isOverdue: boolean;
  daysOverdue: number;
  isDueSoon: boolean;
}

export interface VaccinationScheduleData {
  vaccineName: string;
  ageDays: number;
  isMandatory?: number;
  route?: string;
  notes?: string;
}

export interface Vaccine {
  id: number;
  farmId: number;
  name: string;
  defaultRoute: string | null;
  notes: string | null;
  isDefault: number | null;
  isActive: number | null;
  createdAt: string | null;
}

export interface VaccineData {
  name: string;
  defaultRoute?: string;
  notes?: string;
}

export interface UserData {
  farmId: number;
  name: string;
  role: string;
  password: string;
}

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthSession {
  type: "owner" | "farm" | "user";
  id: number;
  name: string;
  farmId?: number;
  role?: string;
}

export interface SalesSummaryReport {
  period: { start: string; end: string };
  totals: {
    salesCount: number;
    totalAmount: number;
    totalCollected: number;
    totalOutstanding: number;
    averageSaleValue: number;
  };
  dailyBreakdown: {
    date: string;
    salesCount: number;
    amount: number;
    collected: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  gradeBreakdown: {
    grade: string;
    eggsQty: number;
    eggsAmount: number;
    traysQty: number;
    traysAmount: number;
  }[];
}

export interface CustomerHistoryReport {
  customer: {
    id: number;
    name: string;
    businessName: string;
    phone: string;
    category: string;
  };
  period: { start: string; end: string };
  totals: {
    totalPurchases: number;
    totalPaid: number;
    balanceDue: number;
    salesCount: number;
  };
  sales: {
    id: number;
    invoiceNumber: string;
    saleDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentStatus: string;
    items: { itemType: string; grade: string; unitType?: "egg" | "tray" | "peti"; totalEggs?: number; quantity: number; unitPrice: number; lineTotal: number }[];
  }[];
  payments: {
    id: number;
    saleId: number;
    invoiceNumber: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }[];
}

export interface TopCustomer {
  rank: number;
  customerId: number;
  customerName: string;
  businessName: string;
  category: string;
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  salesCount: number;
  lastPurchase: string;
}

export interface SalesTrendPoint {
  period: string;
  label: string;
  revenue: number;
  collected: number;
  outstanding: number;
  salesCount: number;
}

export interface GradeBreakdownReport {
  grade: string;
  eggsQty: number;
  eggsAmount: number;
  traysQty: number;
  traysAmount: number;
  totalAmount: number;
}

export interface SyncConfig {
  atlasUri: string;
  syncEnabled: boolean;
  lastSyncTime: string | null;
  syncIntervalMinutes: number;
  deviceId: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  error: string | null;
}

export interface SyncTestConnectionResult {
  success: boolean;
  message: string;
}

export interface SyncFromCloudStats {
  farms: number;
  flocks: number;
  entries: number;
  sales: number;
  customers: number;
  expenses: number;
  inventory: number;
  vaccinations: number;
  users: number;
  saleItems: number;
  salePayments: number;
  inventoryTransactions: number;
  vaccines: number;
  eggPrices: number;
  dismissedAlerts: number;
  schedules: number;
  counters: number;
  merged: number;
}

export interface SetupCodeResult {
  code: string;
  expiresAt: string;
}

export interface SetupCodeValidation {
  valid: boolean;
  farmName?: string;
  expiresAt?: string;
  error?: string;
}

export interface SetupApplyResult {
  success: boolean;
  farmName: string;
  farmId: number;
  recordsPulled: number;
  message: string;
}

export interface ElectronAPI {
  ipcInvoke: (channel: string, ...args: unknown[]) => Promise<IpcResponse<unknown>>;
  auth: {
    loginOwner: (email: string, password: string) => Promise<IpcResponse<AuthSession>>;
    loginFarm: (username: string, password: string) => Promise<IpcResponse<AuthSession>>;
    logout: () => Promise<IpcResponse>;
    getCurrentUser: () => Promise<IpcResponse<AuthSession | null>>;
  };
  owners: {
    create: (data: OwnerData) => Promise<IpcResponse>;
    getById: (id: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<OwnerData>) => Promise<IpcResponse>;
  };
  farms: {
    create: (data: FarmData) => Promise<IpcResponse>;
    getAll: (ownerId: number) => Promise<IpcResponse>;
    getById: (id: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<FarmData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    resetPassword: (id: number, newPassword: string) => Promise<IpcResponse>;
    checkUsername: (username: string) => Promise<IpcResponse<{ available: boolean }>>;
  };
  users: {
    create: (data: UserData) => Promise<IpcResponse>;
    getByFarm: (farmId: number) => Promise<IpcResponse>;
    getById: (id: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<UserData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
  };
  flocks: {
    create: (data: FlockData) => Promise<IpcResponse>;
    getByFarm: (farmId: number) => Promise<IpcResponse>;
    getById: (id: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<FlockData>) => Promise<IpcResponse>;
    changeStatus: (id: number, status: string, date: string, notes?: string) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    getStats: (id: number) => Promise<IpcResponse>;
  };
  dailyEntries: {
    create: (data: DailyEntryData) => Promise<IpcResponse>;
    update: (id: number, data: Partial<DailyEntryData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    getByFlockAndDate: (flockId: number, date: string) => Promise<IpcResponse>;
    getByFlock: (flockId: number, startDate?: string, endDate?: string) => Promise<IpcResponse>;
    getByFarm: (farmId: number, date: string) => Promise<IpcResponse>;
    getPreviousDayStock: (flockId: number, date: string) => Promise<IpcResponse>;
  };
  eggCategories: {
    getAll: (farmId: number) => Promise<IpcResponse<EggCategory[]>>;
    create: (data: Partial<EggCategory> & { farmId: number; name: string }) => Promise<IpcResponse<EggCategory>>;
    update: (id: number, data: Partial<EggCategory>) => Promise<IpcResponse<EggCategory>>;
    delete: (id: number) => Promise<IpcResponse<EggCategory>>;
    seedDefaults: (farmId: number) => Promise<IpcResponse<{ seeded: number; skipped: boolean }>>;
  };
  expenses: {
    create: (data: ExpenseData) => Promise<IpcResponse>;
    getByFarm: (farmId: number, filters?: ExpenseFilters) => Promise<IpcResponse>;
    getById: (id: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<ExpenseData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    getSummary: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<ExpenseSummary>>;
    getSuppliers: (farmId: number) => Promise<IpcResponse<string[]>>;
  };
  revenue: {
    getDailySummary: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<DailyRevenueSummary>>;
    getTotalRevenue: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<TotalRevenue>>;
    getRevenueVsExpenses: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<RevenueVsExpenses>>;
  };
  financial: {
    getProfitLoss: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<ProfitLossData>>;
    getFinancialTrends: (farmId: number, startDate: string, endDate: string, groupBy: string) => Promise<IpcResponse<FinancialTrendPoint[]>>;
    getPerBirdMetrics: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<PerBirdMetrics>>;
    getPerEggMetrics: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<PerEggMetrics>>;
  };
  alerts: {
    getAll: (farmId: number) => Promise<IpcResponse<FarmAlert[]>>;
    getPaymentAlerts: (farmId: number) => Promise<IpcResponse<PaymentAlert[]>>;
    dismiss: (farmId: number, alertType: string, referenceId: number) => Promise<IpcResponse>;
    undismiss: (farmId: number, alertType: string, referenceId: number) => Promise<IpcResponse>;
    clearDismissed: (farmId: number) => Promise<IpcResponse>;
  };
  inventory: {
    create: (data: InventoryData) => Promise<IpcResponse<InventoryItem>>;
    getByFarm: (farmId: number, itemType?: string) => Promise<IpcResponse<InventoryItem[]>>;
    getById: (id: number) => Promise<IpcResponse<InventoryItemWithTransactions>>;
    update: (id: number, data: Partial<InventoryData>) => Promise<IpcResponse<InventoryItem>>;
    delete: (id: number) => Promise<IpcResponse>;
    addStock: (itemId: number, data: AddStockData) => Promise<IpcResponse<InventoryItem>>;
    reduceStock: (itemId: number, data: ReduceStockData) => Promise<IpcResponse<InventoryItem>>;
    getLowStockItems: (farmId: number) => Promise<IpcResponse<InventoryItem[]>>;
    getExpiringItems: (farmId: number, days: number) => Promise<IpcResponse<InventoryItem[]>>;
  };
  vaccinations: {
    create: (data: VaccinationData) => Promise<IpcResponse>;
    getByFlock: (flockId: number) => Promise<IpcResponse>;
    getUpcoming: (farmId: number, days?: number) => Promise<IpcResponse<UpcomingVaccination[]>>;
    getCompleted: (farmId: number) => Promise<IpcResponse<CompletedVaccination[]>>;
    getAll: (farmId: number, filters?: { flockId?: number; status?: string }) => Promise<IpcResponse<CompletedVaccination[]>>;
    update: (id: number, data: Partial<VaccinationData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    complete: (id: number, data: CompleteVaccinationData) => Promise<IpcResponse>;
    skip: (id: number, data: SkipVaccinationData) => Promise<IpcResponse>;
    reschedule: (id: number, newDate: string) => Promise<IpcResponse>;
    getHistory: (farmId: number, filters: VaccinationHistoryFilters) => Promise<IpcResponse<VaccinationHistoryResponse>>;
    getByFlockDetailed: (flockId: number) => Promise<IpcResponse<FlockVaccinationDetailed>>;
    addCustom: (flockId: number, data: AddCustomVaccinationData) => Promise<IpcResponse>;
    getComplianceStats: (farmId: number) => Promise<IpcResponse<ComplianceStats>>;
    exportHistory: (farmId: number, filters: { flockId?: number; startDate?: string; endDate?: string; status?: string }) => Promise<IpcResponse<VaccinationExportItem[]>>;
    getById: (id: number) => Promise<IpcResponse>;
  };
  backup: {
    create: () => Promise<IpcResponse<BackupInfo>>;
    createToPath: (path: string) => Promise<IpcResponse<BackupInfo>>;
    restore: () => Promise<IpcResponse<RestorePreview>>;
    confirmRestore: (backupPath: string) => Promise<IpcResponse>;
    validate: (backupPath: string) => Promise<IpcResponse<BackupValidation>>;
    getHistory: () => Promise<IpcResponse<BackupInfo[]>>;
    delete: (backupPath: string) => Promise<IpcResponse>;
    openFolder: () => Promise<IpcResponse>;
    getSettings: () => Promise<IpcResponse<AutoBackupSettings>>;
    saveSettings: (settings: Partial<AutoBackupSettings>) => Promise<IpcResponse<AutoBackupSettings>>;
    runAutoBackup: () => Promise<IpcResponse>;
    selectDirectory: () => Promise<IpcResponse<string>>;
  };
  settings: {
    getAll: () => Promise<IpcResponse<AppSettings>>;
    update: (partial: Partial<AppSettings>) => Promise<IpcResponse<AppSettings>>;
    reset: () => Promise<IpcResponse<AppSettings>>;
  };
  profile: {
    changePassword: (currentPassword: string, newPassword: string) => Promise<IpcResponse>;
    getOwnerProfile: () => Promise<IpcResponse<OwnerProfile>>;
    getFarmProfile: () => Promise<IpcResponse<FarmProfile>>;
  };
  data: {
    getSystemInfo: () => Promise<IpcResponse<SystemInfo>>;
    exportAllData: (farmId: number, options: DataExportOptions) => Promise<IpcResponse<Record<string, unknown[]>>>;
    clearDismissedAlerts: (farmId: number) => Promise<IpcResponse>;
    resetFarmData: (farmId: number) => Promise<IpcResponse>;
    deleteOwnerAccount: (ownerId: number, password: string) => Promise<IpcResponse>;
  };
  owner: {
    getDashboardStats: (ownerId: number) => Promise<IpcResponse<OwnerDashboardStats>>;
    getFarmsOverview: (ownerId: number) => Promise<IpcResponse<FarmOverview[]>>;
    getFarmComparison: (ownerId: number, farmIds: number[], startDate: string, endDate: string) => Promise<IpcResponse<FarmComparisonData[]>>;
    getConsolidatedAlerts: (ownerId: number) => Promise<IpcResponse<OwnerAlert[]>>;
    getRecentActivity: (ownerId: number, limit: number) => Promise<IpcResponse<RecentActivity[]>>;
    getStatHistory: (ownerId: number, statType: string, days: number) => Promise<IpcResponse<StatHistoryPoint[]>>;
    getReport: (ownerId: number, params: OwnerReportParams) => Promise<IpcResponse<OwnerReportResult>>;
  };
  dashboard: {
    getFarmStats: (farmId: number) => Promise<IpcResponse>;
    getWeeklyTrends: (farmId: number) => Promise<IpcResponse>;
    getAlerts: (farmId: number) => Promise<IpcResponse>;
    getStatHistory: (farmId: number, statType: string, days: number) => Promise<IpcResponse<StatHistoryPoint[]>>;
  };
  reports: {
    getDailySummary: (farmId: number, date: string) => Promise<IpcResponse<DailyReportData>>;
    getWeeklySummary: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<WeeklyReportData>>;
    getMonthlySummary: (farmId: number, month: number, year: number) => Promise<IpcResponse<MonthlyReportData>>;
    getFlockReport: (flockId: number) => Promise<IpcResponse<FlockReportData>>;
    getFinancialReport: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<FinancialReportData>>;
  };
  vaccinationSchedule: {
    create: (data: VaccinationScheduleData) => Promise<IpcResponse>;
    getAll: () => Promise<IpcResponse>;
    update: (id: number, data: Partial<VaccinationScheduleData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
    resetToDefaults: () => Promise<IpcResponse>;
    generateForFlock: (flockId: number) => Promise<IpcResponse>;
    applyToFlocks: (farmId: number, flockIds: number[]) => Promise<IpcResponse<{ count: number }>>;
  };
  vaccines: {
    getByFarm: (farmId: number) => Promise<IpcResponse<Vaccine[]>>;
    create: (farmId: number, data: VaccineData) => Promise<IpcResponse<Vaccine>>;
    update: (id: number, data: Partial<VaccineData>) => Promise<IpcResponse<Vaccine>>;
    delete: (id: number) => Promise<IpcResponse>;
    resetToDefaults: (farmId: number) => Promise<IpcResponse<Vaccine[]>>;
  };
  customers: {
    create: (data: CustomerData) => Promise<IpcResponse<Customer>>;
    getByFarm: (farmId: number, filters?: CustomerFilters) => Promise<IpcResponse<Customer[]>>;
    getById: (id: number) => Promise<IpcResponse<CustomerWithStats>>;
    update: (id: number, data: Partial<CustomerData>) => Promise<IpcResponse<Customer>>;
    delete: (id: number) => Promise<IpcResponse>;
    deletePermanently: (id: number) => Promise<IpcResponse>;
    search: (farmId: number, query: string) => Promise<IpcResponse<Customer[]>>;
  };
  sales: {
    create: (data: SaleData) => Promise<IpcResponse<Sale>>;
    getByCustomer: (customerId: number) => Promise<IpcResponse<Sale[]>>;
    getByFarm: (farmId: number, filters?: SaleFilters) => Promise<IpcResponse<SaleWithCustomer[]>>;
    getById: (id: number) => Promise<IpcResponse<SaleDetail>>;
    update: (id: number, data: SaleData) => Promise<IpcResponse<Sale>>;
    delete: (id: number) => Promise<IpcResponse>;
    getNextInvoiceNumber: (farmId: number) => Promise<IpcResponse<string>>;
    getSummary: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<SalesSummary>>;
    recordPayment: (data: RecordPaymentData) => Promise<IpcResponse<SalePayment>>;
  };
  payments: {
    getByFarm: (farmId: number, filters?: PaymentFilters) => Promise<IpcResponse<PaymentWithDetails[]>>;
    getByCustomer: (customerId: number) => Promise<IpcResponse<CustomerPayment[]>>;
    delete: (paymentId: number) => Promise<IpcResponse>;
    getSummary: (farmId: number) => Promise<IpcResponse<PaymentsSummary>>;
  };
  receivables: {
    getByFarm: (farmId: number, filter?: string) => Promise<IpcResponse<ReceivableItem[]>>;
    getByCustomer: (customerId: number) => Promise<IpcResponse<ReceivableItem[]>>;
  };
  salesReports: {
    getSummary: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<SalesSummaryReport>>;
    getCustomerHistory: (customerId: number, startDate: string, endDate: string) => Promise<IpcResponse<CustomerHistoryReport>>;
    getTopCustomers: (farmId: number, limit: number, startDate: string, endDate: string) => Promise<IpcResponse<TopCustomer[]>>;
    getSalesTrend: (farmId: number, period: string, startDate: string, endDate: string) => Promise<IpcResponse<SalesTrendPoint[]>>;
    getGradeBreakdown: (farmId: number, startDate: string, endDate: string) => Promise<IpcResponse<GradeBreakdownReport[]>>;
  };
  sync: {
    getConfig: () => Promise<IpcResponse<SyncConfig>>;
    saveConfig: (config: Partial<SyncConfig>) => Promise<IpcResponse<SyncConfig>>;
    getStatus: () => Promise<IpcResponse<SyncStatus>>;
    checkOnline: () => Promise<IpcResponse<boolean>>;
    syncNow: () => Promise<IpcResponse<{ success: boolean; error?: string }>>;
    pullFromCloud: (ownerId: number) => Promise<IpcResponse<{ success: boolean; error?: string; stats?: SyncFromCloudStats }>>;
    testConnection: (atlasUri: string) => Promise<IpcResponse<SyncTestConnectionResult>>;
  };
  setup: {
    generateCode: (farmId: number, expiryDays?: number) => Promise<IpcResponse<SetupCodeResult>>;
    validateCode: (code: string) => Promise<IpcResponse<SetupCodeValidation>>;
    applyCode: (code: string) => Promise<IpcResponse<SetupApplyResult>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
