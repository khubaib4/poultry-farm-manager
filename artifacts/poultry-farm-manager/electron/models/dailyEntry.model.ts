import mongoose from "mongoose";
import { dailyEntrySchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const DailyEntryMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    flockId: { type: Number, index: true },
    entryDate: { type: String, required: true, index: true },
    deaths: { type: Number, default: 0 },
    deathCause: { type: String },
    eggsGradeA: { type: Number, default: 0 },
    eggsGradeB: { type: Number, default: 0 },
    eggsCracked: { type: Number, default: 0 },
    feedConsumedKg: { type: Number, default: 0 },
    waterConsumedLiters: { type: Number },
    notes: { type: String },
    recordedBy: { type: Number, index: true },
  },
  { timestamps: true }
);

DailyEntryMongooseSchema.index({ flockId: 1, entryDate: 1 }, { unique: true });

DailyEntryMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, dailyEntrySchema);
});

export const DailyEntryModel = modelOr("DailyEntry", () =>
  mongoose.model("DailyEntry", DailyEntryMongooseSchema)
);

