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
  eggsGradeA?: number;
  eggsGradeB?: number;
  eggsCracked?: number;
  feedConsumedKg?: number;
  waterConsumedLiters?: number;
  notes?: string;
  recordedBy?: number;
}

export interface EggPriceData {
  farmId: number;
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
  effectiveDate: string;
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
  gradeA: { qty: number; revenue: number };
  gradeB: { qty: number; revenue: number };
  cracked: { qty: number; revenue: number };
  total: number;
}

export interface DailyRevenueSummary {
  daily: DailyRevenueEntry[];
  hasPrices: boolean;
}

export interface TotalRevenue {
  totalRevenue: number;
  totalEggs: number;
  avgPricePerEgg: number;
  byGrade: {
    A: { qty: number; revenue: number };
    B: { qty: number; revenue: number };
    cracked: { qty: number; revenue: number };
  };
}

export interface RevenueVsExpenses {
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitLossData {
  revenue: { byGrade: { A: number; B: number; cracked: number }; total: number };
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
  type: "low_stock" | "expiring" | "vaccination_due";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  referenceId: number;
  createdAt: string;
  isDismissed: boolean;
  actionUrl: string;
}

export interface VaccinationData {
  flockId: number;
  vaccineName: string;
  scheduledDate: string;
  administeredDate?: string;
  administeredBy?: string;
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
    eggsGradeA: number;
    eggsGradeB: number;
    eggsCracked: number;
    deaths: number;
    deathCause: string | null;
    feedConsumedKg: number;
    waterConsumedLiters: number | null;
    notes: string | null;
  }[];
  totals: {
    birds: number;
    eggsGradeA: number;
    eggsGradeB: number;
    eggsCracked: number;
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
    eggsGradeA: number;
    eggsGradeB: number;
    eggsCracked: number;
    eggsTotal: number;
    deaths: number;
    feedKg: number;
  }[];
  weeklyTotals: {
    birds: number;
    eggsGradeA: number;
    eggsGradeB: number;
    eggsCracked: number;
    eggsTotal: number;
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
    eggsGradeA: number;
    eggsGradeB: number;
    eggsCracked: number;
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
    byGrade: { grade: string; eggs: number; revenue: number; pricePerEgg: number }[];
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

export interface OwnerDashboardStats {
  totalBirds: number;
  totalEggsToday: number;
  revenueMonth: number;
  profitMonth: number;
  totalFarms: number;
  totalBirdsChange: number;
  totalEggsTrend: number;
  revenueTrend: number;
  profitTrend: number;
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

export interface VaccinationScheduleData {
  vaccineName: string;
  ageDays: number;
  isMandatory?: number;
  route?: string;
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

export interface ElectronAPI {
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
  eggPrices: {
    createBatch: (farmId: number, prices: { grade: string; pricePerEgg: number; pricePerTray: number }[], effectiveDate: string) => Promise<IpcResponse>;
    getCurrentPrices: (farmId: number) => Promise<IpcResponse>;
    getHistory: (farmId: number, limit?: number) => Promise<IpcResponse>;
    getPriceOnDate: (farmId: number, date: string) => Promise<IpcResponse>;
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
    update: (id: number, data: Partial<VaccinationData>) => Promise<IpcResponse>;
    complete: (id: number, data: CompleteVaccinationData) => Promise<IpcResponse>;
    skip: (id: number, data: SkipVaccinationData) => Promise<IpcResponse>;
    reschedule: (id: number, newDate: string) => Promise<IpcResponse>;
    getHistory: (farmId: number, filters: VaccinationHistoryFilters) => Promise<IpcResponse<VaccinationHistoryResponse>>;
    getByFlockDetailed: (flockId: number) => Promise<IpcResponse<FlockVaccinationDetailed>>;
    addCustom: (flockId: number, data: AddCustomVaccinationData) => Promise<IpcResponse>;
    getComplianceStats: (farmId: number) => Promise<IpcResponse<ComplianceStats>>;
    exportHistory: (farmId: number, filters: { flockId?: number; startDate?: string; endDate?: string; status?: string }) => Promise<IpcResponse<VaccinationExportItem[]>>;
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
  owner: {
    getDashboardStats: (ownerId: number) => Promise<IpcResponse<OwnerDashboardStats>>;
    getFarmsOverview: (ownerId: number) => Promise<IpcResponse<FarmOverview[]>>;
    getFarmComparison: (ownerId: number, farmIds: number[], startDate: string, endDate: string) => Promise<IpcResponse<FarmComparisonData[]>>;
    getConsolidatedAlerts: (ownerId: number) => Promise<IpcResponse<OwnerAlert[]>>;
    getRecentActivity: (ownerId: number, limit: number) => Promise<IpcResponse<RecentActivity[]>>;
  };
  dashboard: {
    getFarmStats: (farmId: number) => Promise<IpcResponse>;
    getWeeklyTrends: (farmId: number) => Promise<IpcResponse>;
    getAlerts: (farmId: number) => Promise<IpcResponse>;
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
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
