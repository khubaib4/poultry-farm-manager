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
    update: (id: number, data: Partial<VaccinationData>) => Promise<IpcResponse>;
  };
  dashboard: {
    getFarmStats: (farmId: number) => Promise<IpcResponse>;
    getWeeklyTrends: (farmId: number) => Promise<IpcResponse>;
    getAlerts: (farmId: number) => Promise<IpcResponse>;
  };
  vaccinationSchedule: {
    create: (data: VaccinationScheduleData) => Promise<IpcResponse>;
    getAll: () => Promise<IpcResponse>;
    update: (id: number, data: Partial<VaccinationScheduleData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
