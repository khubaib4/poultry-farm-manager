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
  description?: string;
  amount: number;
  expenseDate: string;
  supplier?: string;
  receiptRef?: string;
}

export interface InventoryData {
  farmId: number;
  itemType: string;
  itemName: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  expiryDate?: string;
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
    create: (data: EggPriceData) => Promise<IpcResponse>;
    getByFarm: (farmId: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<EggPriceData>) => Promise<IpcResponse>;
  };
  expenses: {
    create: (data: ExpenseData) => Promise<IpcResponse>;
    getByFarm: (farmId: number, startDate?: string, endDate?: string) => Promise<IpcResponse>;
    update: (id: number, data: Partial<ExpenseData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
  };
  inventory: {
    create: (data: InventoryData) => Promise<IpcResponse>;
    getByFarm: (farmId: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<InventoryData>) => Promise<IpcResponse>;
    delete: (id: number) => Promise<IpcResponse>;
  };
  vaccinations: {
    create: (data: VaccinationData) => Promise<IpcResponse>;
    getByFlock: (flockId: number) => Promise<IpcResponse>;
    update: (id: number, data: Partial<VaccinationData>) => Promise<IpcResponse>;
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
