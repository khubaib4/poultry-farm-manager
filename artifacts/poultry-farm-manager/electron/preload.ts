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
  },
  dailyEntries: {
    create: (data: unknown) =>
      ipcRenderer.invoke("dailyEntries:create", data),
    getByFlock: (flockId: number, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke("dailyEntries:getByFlock", flockId, startDate, endDate),
    getByDate: (flockId: number, date: string) =>
      ipcRenderer.invoke("dailyEntries:getByDate", flockId, date),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("dailyEntries:update", id, data),
  },
  eggPrices: {
    create: (data: unknown) => ipcRenderer.invoke("eggPrices:create", data),
    getByFarm: (farmId: number) =>
      ipcRenderer.invoke("eggPrices:getByFarm", farmId),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("eggPrices:update", id, data),
  },
  expenses: {
    create: (data: unknown) => ipcRenderer.invoke("expenses:create", data),
    getByFarm: (farmId: number, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke("expenses:getByFarm", farmId, startDate, endDate),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("expenses:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("expenses:delete", id),
  },
  inventory: {
    create: (data: unknown) => ipcRenderer.invoke("inventory:create", data),
    getByFarm: (farmId: number) =>
      ipcRenderer.invoke("inventory:getByFarm", farmId),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("inventory:update", id, data),
    delete: (id: number) => ipcRenderer.invoke("inventory:delete", id),
  },
  vaccinations: {
    create: (data: unknown) =>
      ipcRenderer.invoke("vaccinations:create", data),
    getByFlock: (flockId: number) =>
      ipcRenderer.invoke("vaccinations:getByFlock", flockId),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinations:update", id, data),
  },
  vaccinationSchedule: {
    create: (data: unknown) =>
      ipcRenderer.invoke("vaccinationSchedule:create", data),
    getAll: () => ipcRenderer.invoke("vaccinationSchedule:getAll"),
    update: (id: number, data: unknown) =>
      ipcRenderer.invoke("vaccinationSchedule:update", id, data),
    delete: (id: number) =>
      ipcRenderer.invoke("vaccinationSchedule:delete", id),
  },
});
