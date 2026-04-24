import mongoose from "mongoose";
import { modelOr } from "./_shared";

const CustomerBalanceMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    farmId: { type: Number, required: true, index: true },
    customerId: { type: Number, required: true, index: true },
    type: {
      type: String,
      enum: ["advance_payment", "overpayment", "adjustment", "applied_to_sale", "refund"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    referenceType: { type: String, enum: ["sale", "manual", null], default: null },
    referenceId: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    notes: { type: String, default: "" },
    date: { type: Date, required: true, index: true },
    createdBy: { type: String, default: null },
  },
  { timestamps: true }
);

CustomerBalanceMongooseSchema.index({ farmId: 1, customerId: 1 });
CustomerBalanceMongooseSchema.index({ farmId: 1, customerId: 1, date: -1 });
CustomerBalanceMongooseSchema.index({ customerId: 1, date: -1 });

export const CustomerBalanceModel = modelOr("CustomerBalance", () =>
  mongoose.model("CustomerBalance", CustomerBalanceMongooseSchema)
);

