import mongoose from "mongoose";
import { salePaymentSchema } from "../schemas";
import { modelOr, zodValidateDoc } from "./_shared";

const SalePaymentMongooseSchema = new mongoose.Schema(
  {
    id: { type: Number, index: true, unique: true, sparse: true },
    saleId: { type: Number, index: true, required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: String, required: true, index: true },
    paymentMethod: { type: String, default: "cash", index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

SalePaymentMongooseSchema.index({ saleId: 1, paymentDate: -1 });

SalePaymentMongooseSchema.pre("validate", function () {
  zodValidateDoc(this, salePaymentSchema);
});

export const SalePaymentModel = modelOr("SalePayment", () =>
  mongoose.model("SalePayment", SalePaymentMongooseSchema)
);

