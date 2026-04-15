import mongoose from "mongoose";
import { inventorySchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const InventoryMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    itemType: { type: String, required: true, index: true },
    itemName: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minThreshold: { type: Number },
    expiryDate: { type: String, index: true },
    lastUpdated: { type: String },
  },
  { timestamps: true }
);

InventoryMongooseSchema.index({ farmId: 1, itemType: 1 });

InventoryMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, inventorySchema);
});

export const InventoryModel = modelOr("Inventory", () =>
  mongoose.model("Inventory", InventoryMongooseSchema)
);

