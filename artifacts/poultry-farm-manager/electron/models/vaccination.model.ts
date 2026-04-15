import mongoose from "mongoose";
import { vaccinationSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const VaccinationMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    flockId: { type: Number, index: true },
    vaccineName: { type: String, required: true, index: true },
    scheduledDate: { type: String, required: true, index: true },
    administeredDate: { type: String, index: true },
    administeredBy: { type: String },
    batchNumber: { type: String, index: true },
    dosage: { type: String },
    route: { type: String, index: true },
    notes: { type: String },
    status: { type: String, default: "pending", index: true },
  },
  { timestamps: true }
);

VaccinationMongooseSchema.index({ flockId: 1, scheduledDate: -1 });

VaccinationMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, vaccinationSchema);
});

export const VaccinationModel = modelOr("Vaccination", () =>
  mongoose.model("Vaccination", VaccinationMongooseSchema)
);

