import mongoose from "mongoose";
import { dismissedAlertSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const DismissedAlertMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    alertType: { type: String, required: true, index: true },
    referenceId: { type: Number, required: true, index: true },
    dismissedAt: { type: String },
  },
  { timestamps: true }
);

DismissedAlertMongooseSchema.index({ farmId: 1, alertType: 1, referenceId: 1 }, { unique: true });

DismissedAlertMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, dismissedAlertSchema);
});

export const DismissedAlertModel = modelOr("DismissedAlert", () =>
  mongoose.model("DismissedAlert", DismissedAlertMongooseSchema)
);

