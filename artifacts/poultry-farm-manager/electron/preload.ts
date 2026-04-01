import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  auth: {
    loginOwner: (email: string, password: string) =>
      ipcRenderer.invoke("auth:loginOwner", email, password),
    loginFarm: (username: string, password: string) =>
      ipcRenderer.invoke("auth:loginFarm", username, password),
    logout: () => ipcRenderer.invoke("auth:logout"),
    getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
  },
  owners: {
    create: (data: unknown) => ipcRenderer.invoke("owners:create", data),
    getById: (id: number) => ipcRenderer.invoke("owners:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("owners:update", id, data),
  },
  farms: {
    create: (data: unknown) => ipcRenderer.invoke("farms:create", data),
    getAll: (ownerId: number) => ipcRenderer.invoke("farms:getAll", ownerId),
    getById: (id: number) => ipcRenderer.invoke("farms:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("farms:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("farms:delete", id),
    resetPassword: (id: number, newPassword: string) =>
      ipcRenderer.invoke("farms:resetPassword", id, newPassword),
    checkUsername: (username: string) =>
      ipcRenderer.invoke("farms:checkUsername", username),
  },
  users: {
    create: (data: unknown) => ipcRenderer.invoke("users:create", data),
    getByFarm: (farmId: number) => ipcRenderer.invoke("users:getByFarm", farmId),
    getById: (id: number) => ipcRenderer.invoke("users:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("users:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("users:delete", id),
  },
  flocks: {
    create: (data: unknown) => ipcRenderer.invoke("flocks:create", data),
    getByFarm: (farmId: number) =>
      ipcRenderer.invoke("flocks:getByFarm", farmId),
    getById: (id: number) => ipcRenderer.invoke("flocks:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("flocks:update", id, data),
    changeStatus: (id: number, status: string, date: string, notes?: string) =>
      ipcRenderer.invoke("flocks:changeStatus", id, status, date, notes),
    delete: (id: number) => ipcRenderer.invoke("flocks:delete", id),
    getStats: (id: number) => ipcRenderer.invoke("flocks:getStats", id),
  },
  dailyEntries: {
    create: (data: unknown) =>
      ipcRenderer.invoke("dailyEntries:create", data),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("dailyEntries:update", id, data),
    delete: (id: number) =>
      ipcRenderer.invoke("dailyEntries:delete", id),
    getByFlockAndDate: (flockId: number, date: string) =>
      ipcRenderer.invoke("dailyEntries:getByFlockAndDate", flockId, date),
    getByFlock: (flockId: number, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke("dailyEntries:getByFlock", flockId, startDate, endDate),
    getByFarm: (farmId: number, date: string) =>
      ipcRenderer.invoke("dailyEntries:getByFarm", farmId, date),
    getPreviousDayStock: (flockId: number, date: string) =>
      ipcRenderer.invoke("dailyEntries:getPreviousDayStock", flockId, date),
  },
  eggPrices: {
    createBatch: (farmId: number, prices: unknown[], effectiveDate: string) =>
      ipcRenderer.invoke("eggPrices:createBatch", farmId, prices, effectiveDate),
    getCurrentPrices: (farmId: number) =>
      ipcRenderer.invoke("eggPrices:getCurrentPrices", farmId),
    getHistory: (farmId: number, limit?: number) =>
      ipcRenderer.invoke("eggPrices:getHistory", farmId, limit),
    getPriceOnDate: (farmId: number, date: string) =>
      ipcRenderer.invoke("eggPrices:getPriceOnDate", farmId, date),
  },
  expenses: {
    create: (data: unknown) => ipcRenderer.invoke("expenses:create", data),
    getByFarm: (farmId: number, filters?: unknown) =>
      ipcRenderer.invoke("expenses:getByFarm", farmId, filters),
    getById: (id: number) => ipcRenderer.invoke("expenses:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("expenses:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("expenses:delete", id),
    getSummary: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("expenses:getSummary", farmId, startDate, endDate),
    getSuppliers: (farmId: number) =>
      ipcRenderer.invoke("expenses:getSuppliers", farmId),
  },
  revenue: {
    getDailySummary: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("revenue:getDailySummary", farmId, startDate, endDate),
    getTotalRevenue: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("revenue:getTotalRevenue", farmId, startDate, endDate),
    getRevenueVsExpenses: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("revenue:getRevenueVsExpenses", farmId, startDate, endDate),
  },
  financial: {
    getProfitLoss: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("financial:getProfitLoss", farmId, startDate, endDate),
    getFinancialTrends: (farmId: number, startDate: string, endDate: string, groupBy: string) =>
      ipcRenderer.invoke("financial:getFinancialTrends", farmId, startDate, endDate, groupBy),
    getPerBirdMetrics: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("financial:getPerBirdMetrics", farmId, startDate, endDate),
    getPerEggMetrics: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("financial:getPerEggMetrics", farmId, startDate, endDate),
  },
  inventory: {
    create: (data: unknown) => ipcRenderer.invoke("inventory:create", data),
    getByFarm: (farmId: number, itemType?: string) =>
      ipcRenderer.invoke("inventory:getByFarm", farmId, itemType),
    getById: (id: number) => ipcRenderer.invoke("inventory:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("inventory:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("inventory:delete", id),
    addStock: (itemId: number, data: unknown) =>
      ipcRenderer.invoke("inventory:addStock", itemId, data),
    reduceStock: (itemId: number, data: unknown) =>
      ipcRenderer.invoke("inventory:reduceStock", itemId, data),
    getLowStockItems: (farmId: number) =>
      ipcRenderer.invoke("inventory:getLowStockItems", farmId),
    getExpiringItems: (farmId: number, days: number) =>
      ipcRenderer.invoke("inventory:getExpiringItems", farmId, days),
  },
  alerts: {
    getAll: (farmId: number) => ipcRenderer.invoke("alerts:getAll", farmId),
    getPaymentAlerts: (farmId: number) => ipcRenderer.invoke("alerts:getPaymentAlerts", farmId),
    dismiss: (farmId: number, alertType: string, referenceId: number) =>
      ipcRenderer.invoke("alerts:dismiss", farmId, alertType, referenceId),
    undismiss: (farmId: number, alertType: string, referenceId: number) =>
      ipcRenderer.invoke("alerts:undismiss", farmId, alertType, referenceId),
    clearDismissed: (farmId: number) =>
      ipcRenderer.invoke("alerts:clearDismissed", farmId),
  },
  vaccinations: {
    create: (data: unknown) =>
      ipcRenderer.invoke("vaccinations:create", data),
    getByFlock: (flockId: number) =>
      ipcRenderer.invoke("vaccinations:getByFlock", flockId),
    getUpcoming: (farmId: number, days?: number) =>
      ipcRenderer.invoke("vaccinations:getUpcoming", farmId, days),
    getCompleted: (farmId: number) =>
      ipcRenderer.invoke("vaccinations:getCompleted", farmId),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinations:update", id, data),
    complete: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinations:complete", id, data),
    skip: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinations:skip", id, data),
    reschedule: (id: number, newDate: string) =>
      ipcRenderer.invoke("vaccinations:reschedule", id, newDate),
    getHistory: (farmId: number, filters: unknown) =>
      ipcRenderer.invoke("vaccinations:getHistory", farmId, filters),
    getByFlockDetailed: (flockId: number) =>
      ipcRenderer.invoke("vaccinations:getByFlockDetailed", flockId),
    addCustom: (flockId: number, data: unknown) =>
      ipcRenderer.invoke("vaccinations:addCustom", flockId, data),
    getComplianceStats: (farmId: number) =>
      ipcRenderer.invoke("vaccinations:getComplianceStats", farmId),
    exportHistory: (farmId: number, filters: unknown) =>
      ipcRenderer.invoke("vaccinations:exportHistory", farmId, filters),
    getAll: (farmId: number, filters?: unknown) =>
      ipcRenderer.invoke("vaccinations:getAll", farmId, filters),
    delete: (id: number) =>
      ipcRenderer.invoke("vaccinations:delete", id),
    getById: (id: number) =>
      ipcRenderer.invoke("vaccinations:getById", id),
  },
  owner: {
    getDashboardStats: (ownerId: number) =>
      ipcRenderer.invoke("owner:getDashboardStats", ownerId),
    getFarmsOverview: (ownerId: number) =>
      ipcRenderer.invoke("owner:getFarmsOverview", ownerId),
    getFarmComparison: (ownerId: number, farmIds: number[], startDate: string, endDate: string) =>
      ipcRenderer.invoke("owner:getFarmComparison", ownerId, farmIds, startDate, endDate),
    getConsolidatedAlerts: (ownerId: number) =>
      ipcRenderer.invoke("owner:getConsolidatedAlerts", ownerId),
    getRecentActivity: (ownerId: number, limit: number) =>
      ipcRenderer.invoke("owner:getRecentActivity", ownerId, limit),
  },
  dashboard: {
    getFarmStats: (farmId: number) =>
      ipcRenderer.invoke("dashboard:getFarmStats", farmId),
    getWeeklyTrends: (farmId: number) =>
      ipcRenderer.invoke("dashboard:getWeeklyTrends", farmId),
    getAlerts: (farmId: number) =>
      ipcRenderer.invoke("dashboard:getAlerts", farmId),
  },
  reports: {
    getDailySummary: (farmId: number, date: string) =>
      ipcRenderer.invoke("reports:getDailySummary", farmId, date),
    getWeeklySummary: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("reports:getWeeklySummary", farmId, startDate, endDate),
    getMonthlySummary: (farmId: number, month: number, year: number) =>
      ipcRenderer.invoke("reports:getMonthlySummary", farmId, month, year),
    getFlockReport: (flockId: number) =>
      ipcRenderer.invoke("reports:getFlockReport", flockId),
    getFinancialReport: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("reports:getFinancialReport", farmId, startDate, endDate),
  },
  backup: {
    create: () => ipcRenderer.invoke("backup:create"),
    createToPath: (path: string) => ipcRenderer.invoke("backup:createToPath", path),
    restore: () => ipcRenderer.invoke("backup:restore"),
    confirmRestore: (backupPath: string) => ipcRenderer.invoke("backup:confirmRestore", backupPath),
    validate: (backupPath: string) => ipcRenderer.invoke("backup:validate", backupPath),
    getHistory: () => ipcRenderer.invoke("backup:getHistory"),
    delete: (backupPath: string) => ipcRenderer.invoke("backup:delete", backupPath),
    openFolder: () => ipcRenderer.invoke("backup:openFolder"),
    getSettings: () => ipcRenderer.invoke("backup:getSettings"),
    saveSettings: (settings: unknown) => ipcRenderer.invoke("backup:saveSettings", settings),
    runAutoBackup: () => ipcRenderer.invoke("backup:runAutoBackup"),
    selectDirectory: () => ipcRenderer.invoke("backup:selectDirectory"),
  },
  settings: {
    getAll: () => ipcRenderer.invoke("settings:getAll"),
    update: (partial: unknown) => ipcRenderer.invoke("settings:update", partial),
    reset: () => ipcRenderer.invoke("settings:reset"),
  },
  profile: {
    changePassword: (currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke("profile:changePassword", currentPassword, newPassword),
    getOwnerProfile: () => ipcRenderer.invoke("profile:getOwnerProfile"),
    getFarmProfile: () => ipcRenderer.invoke("profile:getFarmProfile"),
  },
  data: {
    getSystemInfo: () => ipcRenderer.invoke("data:getSystemInfo"),
    exportAllData: (farmId: number, options: unknown) =>
      ipcRenderer.invoke("data:exportAllData", farmId, options),
    clearDismissedAlerts: (farmId: number) =>
      ipcRenderer.invoke("data:clearDismissedAlerts", farmId),
    resetFarmData: (farmId: number) =>
      ipcRenderer.invoke("data:resetFarmData", farmId),
    deleteOwnerAccount: (ownerId: number, password: string) =>
      ipcRenderer.invoke("data:deleteOwnerAccount", ownerId, password),
  },
  vaccinationSchedule: {
    create: (data: unknown) =>
      ipcRenderer.invoke("vaccinationSchedule:create", data),
    getAll: () => ipcRenderer.invoke("vaccinationSchedule:getAll"),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinationSchedule:update", id, data),
    delete: (id: number) =>
      ipcRenderer.invoke("vaccinationSchedule:delete", id),
    resetToDefaults: () =>
      ipcRenderer.invoke("vaccinationSchedule:resetToDefaults"),
    generateForFlock: (flockId: number) =>
      ipcRenderer.invoke("vaccinationSchedule:generateForFlock", flockId),
    applyToFlocks: (farmId: number, flockIds: number[]) =>
      ipcRenderer.invoke("vaccinationSchedule:applyToFlocks", farmId, flockIds),
  },
  customers: {
    create: (data: unknown) => ipcRenderer.invoke("customers:create", data),
    getByFarm: (farmId: number, filters?: unknown) =>
      ipcRenderer.invoke("customers:getByFarm", farmId, filters),
    getById: (id: number) => ipcRenderer.invoke("customers:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("customers:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("customers:delete", id),
    deletePermanently: (id: number) =>
      ipcRenderer.invoke("customers:deletePermanently", id),
    search: (farmId: number, query: string) =>
      ipcRenderer.invoke("customers:search", farmId, query),
  },
  sales: {
    create: (data: unknown) => ipcRenderer.invoke("sales:create", data),
    getByFarm: (farmId: number, filters?: unknown) =>
      ipcRenderer.invoke("sales:getByFarm", farmId, filters),
    getById: (id: number) => ipcRenderer.invoke("sales:getById", id),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("sales:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("sales:delete", id),
    getNextInvoiceNumber: (farmId: number) =>
      ipcRenderer.invoke("sales:getNextInvoiceNumber", farmId),
    getSummary: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("sales:getSummary", farmId, startDate, endDate),
    recordPayment: (data: unknown) =>
      ipcRenderer.invoke("sales:recordPayment", data),
  },
  payments: {
    getByFarm: (farmId: number, filters?: unknown) =>
      ipcRenderer.invoke("payments:getByFarm", farmId, filters),
    getByCustomer: (customerId: number) =>
      ipcRenderer.invoke("payments:getByCustomer", customerId),
    delete: (paymentId: number) =>
      ipcRenderer.invoke("payments:delete", paymentId),
    getSummary: (farmId: number) =>
      ipcRenderer.invoke("payments:getSummary", farmId),
  },
  receivables: {
    getByFarm: (farmId: number, filter?: string) =>
      ipcRenderer.invoke("receivables:getByFarm", farmId, filter),
    getByCustomer: (customerId: number) =>
      ipcRenderer.invoke("receivables:getByCustomer", customerId),
  },
  salesReports: {
    getSummary: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("salesReports:getSummary", farmId, startDate, endDate),
    getCustomerHistory: (customerId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("salesReports:getCustomerHistory", customerId, startDate, endDate),
    getTopCustomers: (farmId: number, limit: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("salesReports:getTopCustomers", farmId, limit, startDate, endDate),
    getSalesTrend: (farmId: number, period: string, startDate: string, endDate: string) =>
      ipcRenderer.invoke("salesReports:getSalesTrend", farmId, period, startDate, endDate),
    getGradeBreakdown: (farmId: number, startDate: string, endDate: string) =>
      ipcRenderer.invoke("salesReports:getGradeBreakdown", farmId, startDate, endDate),
  },
});
