import mongoose from "mongoose";
import { saleSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const SaleMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true, required: true },
    customerId: { type: Number, index: true, required: true },
    invoiceNumber: { type: String, required: true, index: true },
    saleDate: { type: String, required: true, index: true },
    dueDate: { type: String, index: true },
    subtotal: { type: Number, default: 0 },
    discountType: { type: String, default: "none" },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0, index: true },
    paymentStatus: { type: String, default: "unpaid", index: true },
    notes: { type: String },
    isDeleted: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

SaleMongooseSchema.index({ farmId: 1, saleDate: -1 });
SaleMongooseSchema.index({ farmId: 1, invoiceNumber: 1 }, { unique: true });

SaleMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, saleSchema);
});

export const SaleModel = modelOr("Sale", () =>
  mongoose.model("Sale", SaleMongooseSchema)
);

