import mongoose from "mongoose";
import { flockSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const FlockMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    batchName: { type: String, required: true, trim: true, index: true },
    // Breed standard id (e.g. "bovans-white") for benchmarking.
    breed: { type: String, default: null },
    initialCount: { type: Number, required: true },
    currentCount: { type: Number, required: true },
    arrivalDate: { type: String, required: true, index: true },
    ageAtArrivalDays: { type: Number, default: 0 },
    status: { type: String, default: "active", index: true },
    statusChangedDate: { type: String },
    statusNotes: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

FlockMongooseSchema.index({ farmId: 1, batchName: 1 });

FlockMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, flockSchema);
});

export const FlockModel = modelOr("Flock", () =>
  mongoose.model("Flock", FlockMongooseSchema)
);

