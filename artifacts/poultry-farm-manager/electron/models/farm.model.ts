import mongoose from "mongoose";
import { farmSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const FarmMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    ownerId: { type: Number, index: true },
    name: { type: String, required: true, trim: true, index: true },
    location: { type: String },
    capacity: { type: Number },
    loginUsername: { type: String, required: true, unique: true, trim: true },
    loginPasswordHash: { type: String, required: true },
    isActive: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

FarmMongooseSchema.index({ ownerId: 1, name: 1 });

FarmMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, farmSchema);
});

export const FarmModel = modelOr("Farm", () =>
  mongoose.model("Farm", FarmMongooseSchema)
);

