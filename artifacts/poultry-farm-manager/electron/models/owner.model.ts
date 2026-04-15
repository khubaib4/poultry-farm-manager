import mongoose from "mongoose";
import { ownerSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const OwnerMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

OwnerMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, ownerSchema);
});

export const OwnerModel = modelOr("Owner", () =>
  mongoose.model("Owner", OwnerMongooseSchema)
);

