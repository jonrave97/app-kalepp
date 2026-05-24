import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Modelo de contador genérico para secuencias auto-incrementales.
 * Garantiza unicidad de códigos correlativos bajo alta concurrencia.
 * Uso: Counter.findOneAndUpdate({ _id: 'requestCode' }, { $inc: { seq: 1 } }, { new: true, upsert: true })
 */
const counterSchema = new Schema(
    {
        _id: {
            type: String,
            required: true,
        },
        seq: {
            type: Number,
            default: 0,
        },
    },
    { versionKey: false }
);

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;

