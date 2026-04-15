import { z } from "zod";

// Shared primitives
export const isoDateString = z.string().min(1);
export const idNumber = z.number().int().positive();

// Owners
export const ownerSchema = z.object({
  id: idNumber.optional(),
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  passwordHash: z.string().min(1),
});

// Farms
export const farmSchema = z.object({
  id: idNumber.optional(),
  ownerId: idNumber.optional().nullable(),
  name: z.string().min(1),
  location: z.string().optional().nullable(),
  capacity: z.number().int().optional().nullable(),
  loginUsername: z.string().min(1),
  loginPasswordHash: z.string().min(1),
  isActive: z.number().int().optional().nullable(),
});

// Users
export const userSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  name: z.string().min(1),
  role: z.string().min(1),
  passwordHash: z.string().min(1),
  isActive: z.number().int().optional().nullable(),
});

// Flocks
export const flockSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  batchName: z.string().min(1),
  breed: z.string().optional().nullable(),
  initialCount: z.number().int(),
  currentCount: z.number().int(),
  arrivalDate: isoDateString,
  ageAtArrivalDays: z.number().int().optional().nullable(),
  status: z.string().optional().nullable(),
  statusChangedDate: isoDateString.optional().nullable(),
  statusNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Daily entries
export const dailyEntrySchema = z.object({
  id: idNumber.optional(),
  flockId: idNumber.optional().nullable(),
  entryDate: isoDateString,
  deaths: z.number().int().optional().nullable(),
  deathCause: z.string().optional().nullable(),
  eggsGradeA: z.number().int().optional().nullable(),
  eggsGradeB: z.number().int().optional().nullable(),
  eggsCracked: z.number().int().optional().nullable(),
  feedConsumedKg: z.number().optional().nullable(),
  waterConsumedLiters: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  recordedBy: idNumber.optional().nullable(),
});

// Egg prices
export const eggPriceSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  grade: z.string().min(1),
  pricePerEgg: z.number(),
  pricePerTray: z.number(),
  effectiveDate: isoDateString,
});

// Expenses
export const expenseSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  amount: z.number(),
  expenseDate: isoDateString,
  supplier: z.string().optional().nullable(),
  receiptRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Inventory
export const inventorySchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  itemType: z.string().min(1),
  itemName: z.string().min(1),
  quantity: z.number(),
  unit: z.string().min(1),
  minThreshold: z.number().optional().nullable(),
  expiryDate: isoDateString.optional().nullable(),
  lastUpdated: isoDateString.optional().nullable(),
});

export const inventoryTransactionSchema = z.object({
  id: idNumber.optional(),
  inventoryId: idNumber.optional().nullable(),
  type: z.string().min(1),
  quantity: z.number(),
  date: isoDateString,
  reason: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Vaccinations
export const vaccinationSchema = z.object({
  id: idNumber.optional(),
  flockId: idNumber.optional().nullable(),
  vaccineName: z.string().min(1),
  scheduledDate: isoDateString,
  administeredDate: isoDateString.optional().nullable(),
  administeredBy: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  dosage: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

export const vaccinationScheduleSchema = z.object({
  id: idNumber.optional(),
  vaccineName: z.string().min(1),
  ageDays: z.number().int(),
  isMandatory: z.number().int().optional().nullable(),
  route: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const vaccineSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  name: z.string().min(1),
  defaultRoute: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isDefault: z.number().int().optional().nullable(),
  isActive: z.number().int().optional().nullable(),
});

// Customers
export const customerSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  category: z.string().min(1),
  paymentTermsDays: z.number().int().optional().nullable(),
  defaultPricePerEgg: z.number().optional().nullable(),
  defaultPricePerTray: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.number().int().optional().nullable(),
});

// Sales
export const saleSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  customerId: idNumber.optional().nullable(),
  invoiceNumber: z.string().min(1),
  saleDate: isoDateString,
  dueDate: isoDateString.optional().nullable(),
  subtotal: z.number().optional().nullable(),
  discountType: z.string().optional().nullable(),
  discountValue: z.number().optional().nullable(),
  discountAmount: z.number().optional().nullable(),
  totalAmount: z.number().optional().nullable(),
  paidAmount: z.number().optional().nullable(),
  balanceDue: z.number().optional().nullable(),
  paymentStatus: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isDeleted: z.number().int().optional().nullable(),
});

export const saleItemSchema = z.object({
  id: idNumber.optional(),
  saleId: idNumber.optional().nullable(),
  itemType: z.string().min(1),
  grade: z.string().min(1),
  quantity: z.number().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  lineTotal: z.number().optional().nullable(),
});

export const salePaymentSchema = z.object({
  id: idNumber.optional(),
  saleId: idNumber.optional().nullable(),
  amount: z.number(),
  paymentDate: isoDateString,
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Alerts
export const dismissedAlertSchema = z.object({
  id: idNumber.optional(),
  farmId: idNumber.optional().nullable(),
  alertType: z.string().min(1),
  referenceId: idNumber,
  dismissedAt: isoDateString.optional().nullable(),
});

