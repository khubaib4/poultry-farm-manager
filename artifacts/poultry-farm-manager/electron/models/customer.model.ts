import mongoose from "mongoose";
import { customerSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const CustomerMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true, required: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, index: true },
    address: { type: String },
    businessName: { type: String, index: true },
    category: { type: String, default: "individual", index: true },
    paymentTermsDays: { type: Number, default: 0 },
    defaultPricePerEgg: { type: Number },
    defaultPricePerTray: { type: Number },
    notes: { type: String },
    isActive: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

CustomerMongooseSchema.index({ farmId: 1, name: 1 });

CustomerMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, customerSchema);
});

export const CustomerModel = modelOr("Customer", () =>
  mongoose.model("Customer", CustomerMongooseSchema)
);

