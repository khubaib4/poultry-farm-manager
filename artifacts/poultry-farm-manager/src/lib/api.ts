import type {
  IpcResponse,
  AuthSession,
  OwnerData,
  FarmData,
  FlockData,
  DailyEntryData,
  EggPriceData,
  ExpenseData,
  InventoryData,
  VaccinationData,
  VaccinationScheduleData,
  UserData,
} from "@/types/electron";

function getApi() {
  if (typeof window !== "undefined" && window.electronAPI) {
    return window.electronAPI;
  }
  return null;
}

async function invoke<T>(
  fn: (() => Promise<IpcResponse<T>>) | undefined
): Promise<T> {
  if (!fn) throw new Error("This feature is only available in the desktop app");
  const result = await fn();
  if (!result.success) throw new Error(result.error || "Operation failed");
  return result.data as T;
}

export const auth = {
  loginOwner: (email: string, password: string) =>
    invoke<AuthSession>(() => getApi()!.auth.loginOwner(email, password)),

  loginFarm: (username: string, password: string) =>
    invoke<AuthSession>(() => getApi()!.auth.loginFarm(username, password)),

  logout: () => invoke(() => getApi()!.auth.logout()),

  getCurrentUser: () =>
    invoke<AuthSession | null>(() => getApi()!.auth.getCurrentUser()),
};

export const owners = {
  create: (data: OwnerData) => invoke(() => getApi()!.owners.create(data)),

  getById: (id: number) => invoke(() => getApi()!.owners.getById(id)),

  update: (id: number, data: Partial<OwnerData>) =>
    invoke(() => getApi()!.owners.update(id, data)),
};

export const farms = {
  create: (data: FarmData) => invoke(() => getApi()!.farms.create(data)),

  getAll: (ownerId: number) => invoke(() => getApi()!.farms.getAll(ownerId)),

  getById: (id: number) => invoke(() => getApi()!.farms.getById(id)),

  update: (id: number, data: Partial<FarmData>) =>
    invoke(() => getApi()!.farms.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.farms.delete(id)),

  resetPassword: (id: number, newPassword: string) =>
    invoke(() => getApi()!.farms.resetPassword(id, newPassword)),

  checkUsername: (username: string) =>
    invoke<{ available: boolean }>(() => getApi()!.farms.checkUsername(username)),
};

export const users = {
  create: (data: UserData) => invoke(() => getApi()!.users.create(data)),

  getByFarm: (farmId: number) => invoke(() => getApi()!.users.getByFarm(farmId)),

  getById: (id: number) => invoke(() => getApi()!.users.getById(id)),

  update: (id: number, data: Partial<UserData>) =>
    invoke(() => getApi()!.users.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.users.delete(id)),
};

export const flocks = {
  create: (data: FlockData) => invoke(() => getApi()!.flocks.create(data)),

  getByFarm: (farmId: number) =>
    invoke(() => getApi()!.flocks.getByFarm(farmId)),

  getById: (id: number) => invoke(() => getApi()!.flocks.getById(id)),

  update: (id: number, data: Partial<FlockData>) =>
    invoke(() => getApi()!.flocks.update(id, data)),

  changeStatus: (id: number, status: string, date: string, notes?: string) =>
    invoke(() => getApi()!.flocks.changeStatus(id, status, date, notes)),

  delete: (id: number) => invoke(() => getApi()!.flocks.delete(id)),

  getStats: (id: number) => invoke(() => getApi()!.flocks.getStats(id)),
};

export const dailyEntries = {
  create: (data: DailyEntryData) =>
    invoke(() => getApi()!.dailyEntries.create(data)),

  getByFlock: (flockId: number, startDate?: string, endDate?: string) =>
    invoke(() => getApi()!.dailyEntries.getByFlock(flockId, startDate, endDate)),

  getByDate: (flockId: number, date: string) =>
    invoke(() => getApi()!.dailyEntries.getByDate(flockId, date)),

  update: (id: number, data: Partial<DailyEntryData>) =>
    invoke(() => getApi()!.dailyEntries.update(id, data)),
};

export const eggPrices = {
  create: (data: EggPriceData) =>
    invoke(() => getApi()!.eggPrices.create(data)),

  getByFarm: (farmId: number) =>
    invoke(() => getApi()!.eggPrices.getByFarm(farmId)),

  update: (id: number, data: Partial<EggPriceData>) =>
    invoke(() => getApi()!.eggPrices.update(id, data)),
};

export const expenses = {
  create: (data: ExpenseData) =>
    invoke(() => getApi()!.expenses.create(data)),

  getByFarm: (farmId: number, startDate?: string, endDate?: string) =>
    invoke(() => getApi()!.expenses.getByFarm(farmId, startDate, endDate)),

  update: (id: number, data: Partial<ExpenseData>) =>
    invoke(() => getApi()!.expenses.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.expenses.delete(id)),
};

export const inventory = {
  create: (data: InventoryData) =>
    invoke(() => getApi()!.inventory.create(data)),

  getByFarm: (farmId: number) =>
    invoke(() => getApi()!.inventory.getByFarm(farmId)),

  update: (id: number, data: Partial<InventoryData>) =>
    invoke(() => getApi()!.inventory.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.inventory.delete(id)),
};

export const vaccinations = {
  create: (data: VaccinationData) =>
    invoke(() => getApi()!.vaccinations.create(data)),

  getByFlock: (flockId: number) =>
    invoke(() => getApi()!.vaccinations.getByFlock(flockId)),

  update: (id: number, data: Partial<VaccinationData>) =>
    invoke(() => getApi()!.vaccinations.update(id, data)),
};

export const vaccinationSchedule = {
  create: (data: VaccinationScheduleData) =>
    invoke(() => getApi()!.vaccinationSchedule.create(data)),

  getAll: () => invoke(() => getApi()!.vaccinationSchedule.getAll()),

  update: (id: number, data: Partial<VaccinationScheduleData>) =>
    invoke(() => getApi()!.vaccinationSchedule.update(id, data)),

  delete: (id: number) =>
    invoke(() => getApi()!.vaccinationSchedule.delete(id)),
};

export const isElectron = (): boolean => {
  return typeof window !== "undefined" && !!window.electronAPI;
};
