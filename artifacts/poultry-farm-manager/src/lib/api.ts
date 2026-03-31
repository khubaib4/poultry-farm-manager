import type {
  IpcResponse,
  AuthSession,
  OwnerData,
  FarmData,
  FlockData,
  DailyEntryData,
  EggPriceData,
  ExpenseData,
  ExpenseFilters,
  ExpenseSummary,
  DailyRevenueSummary,
  TotalRevenue,
  RevenueVsExpenses,
  ProfitLossData,
  FinancialTrendPoint,
  PerBirdMetrics,
  PerEggMetrics,
  InventoryData,
  InventoryItem,
  InventoryItemWithTransactions,
  AddStockData,
  ReduceStockData,
  FarmAlert,
  VaccinationData,
  VaccinationScheduleData,
  UpcomingVaccination,
  CompletedVaccination,
  CompleteVaccinationData,
  SkipVaccinationData,
  VaccinationHistoryFilters,
  VaccinationHistoryResponse,
  FlockVaccinationDetailed,
  AddCustomVaccinationData,
  ComplianceStats,
  VaccinationExportItem,
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  FlockReportData,
  FinancialReportData,
  UserData,
  OwnerDashboardStats,
  FarmOverview,
  FarmComparisonData,
  OwnerAlert,
  RecentActivity,
  BackupInfo,
  AutoBackupSettings,
  BackupValidation,
  RestorePreview,
  AppSettings,
  OwnerProfile,
  FarmProfile,
  SystemInfo,
  DataExportOptions,
  CustomerData,
  Customer,
  CustomerFilters,
  CustomerWithStats,
  SaleData,
  Sale,
  SaleWithCustomer,
  SaleDetail,
  SaleFilters,
  SalesSummary,
  SalePayment,
  RecordPaymentData,
  PaymentWithDetails,
  CustomerPayment,
  PaymentFilters,
  PaymentsSummary,
  ReceivableItem,
  PaymentAlert,
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

  update: (id: number, data: Partial<DailyEntryData>) =>
    invoke(() => getApi()!.dailyEntries.update(id, data)),

  delete: (id: number) =>
    invoke(() => getApi()!.dailyEntries.delete(id)),

  getByFlockAndDate: (flockId: number, date: string) =>
    invoke(() => getApi()!.dailyEntries.getByFlockAndDate(flockId, date)),

  getByFlock: (flockId: number, startDate?: string, endDate?: string) =>
    invoke(() => getApi()!.dailyEntries.getByFlock(flockId, startDate, endDate)),

  getByFarm: (farmId: number, date: string) =>
    invoke(() => getApi()!.dailyEntries.getByFarm(farmId, date)),

  getPreviousDayStock: (flockId: number, date: string) =>
    invoke(() => getApi()!.dailyEntries.getPreviousDayStock(flockId, date)),
};

export const eggPrices = {
  createBatch: (farmId: number, prices: { grade: string; pricePerEgg: number; pricePerTray: number }[], effectiveDate: string) =>
    invoke(() => getApi()!.eggPrices.createBatch(farmId, prices, effectiveDate)),

  getCurrentPrices: (farmId: number) =>
    invoke(() => getApi()!.eggPrices.getCurrentPrices(farmId)),

  getHistory: (farmId: number, limit?: number) =>
    invoke(() => getApi()!.eggPrices.getHistory(farmId, limit)),

  getPriceOnDate: (farmId: number, date: string) =>
    invoke(() => getApi()!.eggPrices.getPriceOnDate(farmId, date)),
};

export const expenses = {
  create: (data: ExpenseData) =>
    invoke(() => getApi()!.expenses.create(data)),

  getByFarm: (farmId: number, filters?: ExpenseFilters) =>
    invoke(() => getApi()!.expenses.getByFarm(farmId, filters)),

  getById: (id: number) =>
    invoke(() => getApi()!.expenses.getById(id)),

  update: (id: number, data: Partial<ExpenseData>) =>
    invoke(() => getApi()!.expenses.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.expenses.delete(id)),

  getSummary: (farmId: number, startDate: string, endDate: string) =>
    invoke<ExpenseSummary>(() => getApi()!.expenses.getSummary(farmId, startDate, endDate)),

  getSuppliers: (farmId: number) =>
    invoke<string[]>(() => getApi()!.expenses.getSuppliers(farmId)),
};

export const revenue = {
  getDailySummary: (farmId: number, startDate: string, endDate: string) =>
    invoke<DailyRevenueSummary>(() => getApi()!.revenue.getDailySummary(farmId, startDate, endDate)),

  getTotalRevenue: (farmId: number, startDate: string, endDate: string) =>
    invoke<TotalRevenue>(() => getApi()!.revenue.getTotalRevenue(farmId, startDate, endDate)),

  getRevenueVsExpenses: (farmId: number, startDate: string, endDate: string) =>
    invoke<RevenueVsExpenses>(() => getApi()!.revenue.getRevenueVsExpenses(farmId, startDate, endDate)),
};

export const financial = {
  getProfitLoss: (farmId: number, startDate: string, endDate: string) =>
    invoke<ProfitLossData>(() => getApi()!.financial.getProfitLoss(farmId, startDate, endDate)),

  getFinancialTrends: (farmId: number, startDate: string, endDate: string, groupBy: string) =>
    invoke<FinancialTrendPoint[]>(() => getApi()!.financial.getFinancialTrends(farmId, startDate, endDate, groupBy)),

  getPerBirdMetrics: (farmId: number, startDate: string, endDate: string) =>
    invoke<PerBirdMetrics>(() => getApi()!.financial.getPerBirdMetrics(farmId, startDate, endDate)),

  getPerEggMetrics: (farmId: number, startDate: string, endDate: string) =>
    invoke<PerEggMetrics>(() => getApi()!.financial.getPerEggMetrics(farmId, startDate, endDate)),
};

export const inventory = {
  create: (data: InventoryData) =>
    invoke<InventoryItem>(() => getApi()!.inventory.create(data)),

  getByFarm: (farmId: number, itemType?: string) =>
    invoke<InventoryItem[]>(() => getApi()!.inventory.getByFarm(farmId, itemType)),

  getById: (id: number) =>
    invoke<InventoryItemWithTransactions>(() => getApi()!.inventory.getById(id)),

  update: (id: number, data: Partial<InventoryData>) =>
    invoke<InventoryItem>(() => getApi()!.inventory.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.inventory.delete(id)),

  addStock: (itemId: number, data: AddStockData) =>
    invoke<InventoryItem>(() => getApi()!.inventory.addStock(itemId, data)),

  reduceStock: (itemId: number, data: ReduceStockData) =>
    invoke<InventoryItem>(() => getApi()!.inventory.reduceStock(itemId, data)),

  getLowStockItems: (farmId: number) =>
    invoke<InventoryItem[]>(() => getApi()!.inventory.getLowStockItems(farmId)),

  getExpiringItems: (farmId: number, days: number) =>
    invoke<InventoryItem[]>(() => getApi()!.inventory.getExpiringItems(farmId, days)),
};

export const alerts = {
  getAll: (farmId: number) =>
    invoke<FarmAlert[]>(() => getApi()!.alerts.getAll(farmId)),

  getPaymentAlerts: (farmId: number) =>
    invoke<PaymentAlert[]>(() => getApi()!.alerts.getPaymentAlerts(farmId)),

  dismiss: (farmId: number, alertType: string, referenceId: number) =>
    invoke(() => getApi()!.alerts.dismiss(farmId, alertType, referenceId)),

  undismiss: (farmId: number, alertType: string, referenceId: number) =>
    invoke(() => getApi()!.alerts.undismiss(farmId, alertType, referenceId)),

  clearDismissed: (farmId: number) =>
    invoke(() => getApi()!.alerts.clearDismissed(farmId)),
};

export const vaccinations = {
  create: (data: VaccinationData) =>
    invoke(() => getApi()!.vaccinations.create(data)),

  getByFlock: (flockId: number) =>
    invoke(() => getApi()!.vaccinations.getByFlock(flockId)),

  getUpcoming: (farmId: number, days?: number) =>
    invoke<UpcomingVaccination[]>(() => getApi()!.vaccinations.getUpcoming(farmId, days)),

  getCompleted: (farmId: number) =>
    invoke<CompletedVaccination[]>(() => getApi()!.vaccinations.getCompleted(farmId)),

  update: (id: number, data: Partial<VaccinationData>) =>
    invoke(() => getApi()!.vaccinations.update(id, data)),

  complete: (id: number, data: CompleteVaccinationData) =>
    invoke(() => getApi()!.vaccinations.complete(id, data)),

  skip: (id: number, data: SkipVaccinationData) =>
    invoke(() => getApi()!.vaccinations.skip(id, data)),

  reschedule: (id: number, newDate: string) =>
    invoke(() => getApi()!.vaccinations.reschedule(id, newDate)),

  getHistory: (farmId: number, filters: VaccinationHistoryFilters) =>
    invoke<VaccinationHistoryResponse>(() => getApi()!.vaccinations.getHistory(farmId, filters)),

  getByFlockDetailed: (flockId: number) =>
    invoke<FlockVaccinationDetailed>(() => getApi()!.vaccinations.getByFlockDetailed(flockId)),

  addCustom: (flockId: number, data: AddCustomVaccinationData) =>
    invoke(() => getApi()!.vaccinations.addCustom(flockId, data)),

  getComplianceStats: (farmId: number) =>
    invoke<ComplianceStats>(() => getApi()!.vaccinations.getComplianceStats(farmId)),

  exportHistory: (farmId: number, filters: { flockId?: number; startDate?: string; endDate?: string; status?: string }) =>
    invoke<VaccinationExportItem[]>(() => getApi()!.vaccinations.exportHistory(farmId, filters)),
};

export const vaccinationSchedule = {
  create: (data: VaccinationScheduleData) =>
    invoke(() => getApi()!.vaccinationSchedule.create(data)),

  getAll: () => invoke(() => getApi()!.vaccinationSchedule.getAll()),

  update: (id: number, data: Partial<VaccinationScheduleData>) =>
    invoke(() => getApi()!.vaccinationSchedule.update(id, data)),

  delete: (id: number) =>
    invoke(() => getApi()!.vaccinationSchedule.delete(id)),

  resetToDefaults: () =>
    invoke(() => getApi()!.vaccinationSchedule.resetToDefaults()),

  generateForFlock: (flockId: number) =>
    invoke(() => getApi()!.vaccinationSchedule.generateForFlock(flockId)),
};

export const dashboard = {
  getFarmStats: (farmId: number) =>
    invoke(() => getApi()!.dashboard.getFarmStats(farmId)),

  getWeeklyTrends: (farmId: number) =>
    invoke(() => getApi()!.dashboard.getWeeklyTrends(farmId)),

  getAlerts: (farmId: number) =>
    invoke(() => getApi()!.dashboard.getAlerts(farmId)),
};

export const reports = {
  getDailySummary: (farmId: number, date: string) =>
    invoke<DailyReportData>(() => getApi()!.reports.getDailySummary(farmId, date)),

  getWeeklySummary: (farmId: number, startDate: string, endDate: string) =>
    invoke<WeeklyReportData>(() => getApi()!.reports.getWeeklySummary(farmId, startDate, endDate)),

  getMonthlySummary: (farmId: number, month: number, year: number) =>
    invoke<MonthlyReportData>(() => getApi()!.reports.getMonthlySummary(farmId, month, year)),

  getFlockReport: (flockId: number) =>
    invoke<FlockReportData>(() => getApi()!.reports.getFlockReport(flockId)),

  getFinancialReport: (farmId: number, startDate: string, endDate: string) =>
    invoke<FinancialReportData>(() => getApi()!.reports.getFinancialReport(farmId, startDate, endDate)),
};

export const owner = {
  getDashboardStats: (ownerId: number) =>
    invoke<OwnerDashboardStats>(() => getApi()!.owner.getDashboardStats(ownerId)),

  getFarmsOverview: (ownerId: number) =>
    invoke<FarmOverview[]>(() => getApi()!.owner.getFarmsOverview(ownerId)),

  getFarmComparison: (ownerId: number, farmIds: number[], startDate: string, endDate: string) =>
    invoke<FarmComparisonData[]>(() => getApi()!.owner.getFarmComparison(ownerId, farmIds, startDate, endDate)),

  getConsolidatedAlerts: (ownerId: number) =>
    invoke<OwnerAlert[]>(() => getApi()!.owner.getConsolidatedAlerts(ownerId)),

  getRecentActivity: (ownerId: number, limit: number = 20) =>
    invoke<RecentActivity[]>(() => getApi()!.owner.getRecentActivity(ownerId, limit)),
};

export const backup = {
  create: () =>
    invoke<BackupInfo>(() => getApi()!.backup.create()),

  createToPath: (path: string) =>
    invoke<BackupInfo>(() => getApi()!.backup.createToPath(path)),

  restore: () =>
    invoke<RestorePreview>(() => getApi()!.backup.restore()),

  confirmRestore: (backupPath: string) =>
    invoke(() => getApi()!.backup.confirmRestore(backupPath)),

  validate: (backupPath: string) =>
    invoke<BackupValidation>(() => getApi()!.backup.validate(backupPath)),

  getHistory: () =>
    invoke<BackupInfo[]>(() => getApi()!.backup.getHistory()),

  delete: (backupPath: string) =>
    invoke(() => getApi()!.backup.delete(backupPath)),

  openFolder: () =>
    invoke(() => getApi()!.backup.openFolder()),

  getSettings: () =>
    invoke<AutoBackupSettings>(() => getApi()!.backup.getSettings()),

  saveSettings: (settings: Partial<AutoBackupSettings>) =>
    invoke<AutoBackupSettings>(() => getApi()!.backup.saveSettings(settings)),

  runAutoBackup: () =>
    invoke(() => getApi()!.backup.runAutoBackup()),

  selectDirectory: () =>
    invoke<string>(() => getApi()!.backup.selectDirectory()),
};

export const settings = {
  getAll: () =>
    invoke<AppSettings>(() => getApi()!.settings.getAll()),

  update: (partial: Partial<AppSettings>) =>
    invoke<AppSettings>(() => getApi()!.settings.update(partial)),

  reset: () =>
    invoke<AppSettings>(() => getApi()!.settings.reset()),
};

export const profile = {
  changePassword: (currentPassword: string, newPassword: string) =>
    invoke(() => getApi()!.profile.changePassword(currentPassword, newPassword)),

  getOwnerProfile: () =>
    invoke<OwnerProfile>(() => getApi()!.profile.getOwnerProfile()),

  getFarmProfile: () =>
    invoke<FarmProfile>(() => getApi()!.profile.getFarmProfile()),
};

export const data = {
  getSystemInfo: () =>
    invoke<SystemInfo>(() => getApi()!.data.getSystemInfo()),

  exportAllData: (farmId: number, options: DataExportOptions) =>
    invoke<Record<string, unknown[]>>(() => getApi()!.data.exportAllData(farmId, options)),

  clearDismissedAlerts: (farmId: number) =>
    invoke(() => getApi()!.data.clearDismissedAlerts(farmId)),

  resetFarmData: (farmId: number) =>
    invoke(() => getApi()!.data.resetFarmData(farmId)),

  deleteOwnerAccount: (ownerId: number, password: string) =>
    invoke(() => getApi()!.data.deleteOwnerAccount(ownerId, password)),
};

export const customers = {
  create: (data: CustomerData) =>
    invoke<Customer>(() => getApi()!.customers.create(data)),

  getByFarm: (farmId: number, filters?: CustomerFilters) =>
    invoke<Customer[]>(() => getApi()!.customers.getByFarm(farmId, filters)),

  getById: (id: number) =>
    invoke<CustomerWithStats>(() => getApi()!.customers.getById(id)),

  update: (id: number, data: Partial<CustomerData>) =>
    invoke<Customer>(() => getApi()!.customers.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.customers.delete(id)),

  deletePermanently: (id: number) =>
    invoke(() => getApi()!.customers.deletePermanently(id)),

  search: (farmId: number, query: string) =>
    invoke<Customer[]>(() => getApi()!.customers.search(farmId, query)),
};

export const sales = {
  create: (data: SaleData) =>
    invoke<Sale>(() => getApi()!.sales.create(data)),

  getByFarm: (farmId: number, filters?: SaleFilters) =>
    invoke<SaleWithCustomer[]>(() => getApi()!.sales.getByFarm(farmId, filters)),

  getById: (id: number) =>
    invoke<SaleDetail>(() => getApi()!.sales.getById(id)),

  update: (id: number, data: SaleData) =>
    invoke<Sale>(() => getApi()!.sales.update(id, data)),

  delete: (id: number) => invoke(() => getApi()!.sales.delete(id)),

  getNextInvoiceNumber: (farmId: number) =>
    invoke<string>(() => getApi()!.sales.getNextInvoiceNumber(farmId)),

  getSummary: (farmId: number, startDate: string, endDate: string) =>
    invoke<SalesSummary>(() => getApi()!.sales.getSummary(farmId, startDate, endDate)),

  recordPayment: (data: RecordPaymentData) =>
    invoke<SalePayment>(() => getApi()!.sales.recordPayment(data)),
};

export const payments = {
  getByFarm: (farmId: number, filters?: PaymentFilters) =>
    invoke<PaymentWithDetails[]>(() => getApi()!.payments.getByFarm(farmId, filters)),

  getByCustomer: (customerId: number) =>
    invoke<CustomerPayment[]>(() => getApi()!.payments.getByCustomer(customerId)),

  delete: (paymentId: number) =>
    invoke(() => getApi()!.payments.delete(paymentId)),

  getSummary: (farmId: number) =>
    invoke<PaymentsSummary>(() => getApi()!.payments.getSummary(farmId)),
};

export const receivables = {
  getByFarm: (farmId: number, filter?: string) =>
    invoke<ReceivableItem[]>(() => getApi()!.receivables.getByFarm(farmId, filter)),

  getByCustomer: (customerId: number) =>
    invoke<ReceivableItem[]>(() => getApi()!.receivables.getByCustomer(customerId)),
};

export const isElectron = (): boolean => {
  return typeof window !== "undefined" && !!window.electronAPI;
};
