import mongoose from "mongoose";


const { Schema } = mongoose;

const URLIdSchema = new Schema({
    url: { type: String, required: true },
    url_id: { type: String, required: true, unique: true },
    expireAt: { type: Date, required: true },
});

export const URLId = mongoose.model('URLId', URLIdSchema);
