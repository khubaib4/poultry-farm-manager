import mongoose from "mongoose";
import { saleItemSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const SaleItemMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    saleId: { type: Number, index: true, required: true },
    itemType: { type: String, required: true, index: true },
    grade: { type: String, required: true, index: true },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SaleItemMongooseSchema.index({ saleId: 1 });

SaleItemMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, saleItemSchema);
});

export const SaleItemModel = modelOr("SaleItem", () =>
  mongoose.model("SaleItem", SaleItemMongooseSchema)
);

