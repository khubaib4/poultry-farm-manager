import mongoose from "mongoose";
import { stockAdjustmentSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const StockAdjustmentMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true, required: true },
    adjustmentDate: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["wastage", "breakage", "correction", "opening_stock"],
      index: true,
    },
    quantity: { type: Number, required: true },
    reason: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

StockAdjustmentMongooseSchema.index({ farmId: 1, adjustmentDate: -1 });

StockAdjustmentMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, stockAdjustmentSchema);
});

export const StockAdjustmentModel = modelOr("StockAdjustment", () =>
  mongoose.model("StockAdjustment", StockAdjustmentMongooseSchema)
);

