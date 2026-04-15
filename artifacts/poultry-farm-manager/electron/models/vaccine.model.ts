import mongoose from "mongoose";
import { vaccineSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const VaccineMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    name: { type: String, required: true, index: true, trim: true },
    defaultRoute: { type: String },
    notes: { type: String },
    isDefault: { type: Number, default: 0, index: true },
    isActive: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

VaccineMongooseSchema.index({ farmId: 1, name: 1 }, { unique: true });

VaccineMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, vaccineSchema);
});

export const VaccineModel = modelOr("Vaccine", () =>
  mongoose.model("Vaccine", VaccineMongooseSchema)
);

