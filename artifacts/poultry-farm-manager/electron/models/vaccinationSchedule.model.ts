import mongoose from "mongoose";
import { vaccinationScheduleSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const VaccinationScheduleMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    vaccineName: { type: String, required: true, index: true },
    ageDays: { type: Number, required: true, index: true },
    isMandatory: { type: Number, default: 1, index: true },
    route: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

VaccinationScheduleMongooseSchema.index({ vaccineName: 1, ageDays: 1 }, { unique: true });

VaccinationScheduleMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, vaccinationScheduleSchema);
});

export const VaccinationScheduleModel = modelOr("VaccinationSchedule", () =>
  mongoose.model("VaccinationSchedule", VaccinationScheduleMongooseSchema)
);

