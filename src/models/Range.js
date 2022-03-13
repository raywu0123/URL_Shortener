import mongoose from "mongoose";


const { Schema } = mongoose;

const RangeSchema = new Schema({
    counter: { type: Number, default: -1 },
});

export const Range = mongoose.model('Range', RangeSchema);
