import { Schema, model } from "mongoose";

const urlSchema = new Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

export const urlModel = model("url", urlSchema);