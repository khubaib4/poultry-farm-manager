import mongoose from "mongoose";
import { eggPriceSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const EggPriceMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    farmId: { type: Number, index: true },
    grade: { type: String, required: true, index: true },
    pricePerEgg: { type: Number, required: true },
    pricePerTray: { type: Number, required: true },
    effectiveDate: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

EggPriceMongooseSchema.index({ farmId: 1, grade: 1, effectiveDate: -1 });

EggPriceMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, eggPriceSchema);
});

export const EggPriceModel = modelOr("EggPrice", () =>
  mongoose.model("EggPrice", EggPriceMongooseSchema)
);

