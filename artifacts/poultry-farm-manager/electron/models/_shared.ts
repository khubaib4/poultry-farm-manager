import mongoose from "mongoose";
import type { ZodSchema } from "zod";

export function zodValidateDoc(doc: mongoose.Document, schema: ZodSchema<unknown>) {
  const obj = doc.toObject({ depopulate: true, versionKey: false });
  // Strip mongoose internal fields if present
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, __v, ...rest } = obj as Record<string, unknown>;
  schema.parse(rest);
}

export function modelOr<T extends mongoose.Model<unknown>>(name: string, factory: () => T): T {
  return (mongoose.models[name] as T | undefined) ?? factory();
}

