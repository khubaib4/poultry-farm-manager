import mongoose from "mongoose";
import { expenseSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const ExpenseMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    amount: { type: Number, required: true },
    expenseDate: { type: String, required: true, index: true },
    supplier: { type: String, index: true },
    receiptRef: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

ExpenseMongooseSchema.index({ farmId: 1, expenseDate: -1 });

ExpenseMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, expenseSchema);
});

export const ExpenseModel = modelOr("Expense", () =>
  mongoose.model("Expense", ExpenseMongooseSchema)
);

