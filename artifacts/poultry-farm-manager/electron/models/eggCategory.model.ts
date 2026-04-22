import mongoose from "mongoose";
import { eggCategorySchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const EggCategoryMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    defaultPrice: { type: Number, default: 0 },
    unit: { type: String, default: "tray" }, // tray, dozen, piece, crate
    isActive: { type: Number, default: 1 },
    sortOrder: { type: Number, default: 0 },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { timestamps: true }
);

EggCategoryMongooseSchema.index({ farmId: 1, name: 1 }, { unique: true });
EggCategoryMongooseSchema.index({ farmId: 1, isActive: 1 });

EggCategoryMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, eggCategorySchema);
});

export const EggCategoryModel = modelOr("EggCategory", () =>
  mongoose.model("EggCategory", EggCategoryMongooseSchema)
);

