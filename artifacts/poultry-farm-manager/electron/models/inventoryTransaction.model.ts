import mongoose from "mongoose";
import { inventoryTransactionSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const InventoryTransactionMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    inventoryId: { type: Number, required: true, index: true },
    type: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    date: { type: String, required: true, index: true },
    reason: { type: String },
    supplier: { type: String },
    cost: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
);

InventoryTransactionMongooseSchema.index({ inventoryId: 1, date: -1 });

InventoryTransactionMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, inventoryTransactionSchema);
});

export const InventoryTransactionModel = modelOr("InventoryTransaction", () =>
  mongoose.model("InventoryTransaction", InventoryTransactionMongooseSchema)
);

