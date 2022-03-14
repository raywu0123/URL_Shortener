import mongoose from 'mongoose';

const { Schema } = mongoose;

const RangeSchema = new Schema({
  counter: { type: Number, default: -1 },
});

const Range = mongoose.model('Range', RangeSchema);
export default Range;
