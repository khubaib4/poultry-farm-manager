import mongoose from "mongoose";
import { modelOr } from "./_shared";

const CounterMongooseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const CounterModel = modelOr("Counter", () =>
  mongoose.model("Counter", CounterMongooseSchema)
);

export async function nextSequence(name: string): Promise<number> {
  const doc = await CounterModel.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true }
  ).lean();
  return doc!.seq;
}

