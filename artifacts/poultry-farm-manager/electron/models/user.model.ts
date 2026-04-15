import mongoose from "mongoose";
import { userSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const UserMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, index: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

UserMongooseSchema.index({ farmId: 1, role: 1 });

UserMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, userSchema);
});

export const UserModel = modelOr("User", () =>
  mongoose.model("User", UserMongooseSchema)
);

