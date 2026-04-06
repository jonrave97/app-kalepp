import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const kitEppSchema = new Schema(
    {
        epp:      { type: Types.ObjectId, ref: 'Epps', required: true },
        quantity: { type: Number, required: true, min: [1, 'La cantidad debe ser mayor a 0'] },
    },
    { _id: false }
);

const kitSchema = new Schema(
    {
        name: {
            type:     String,
            required: [true, 'El nombre del kit es obligatorio'],
            trim:     true,
        },
        description: {
            type:    String,
            trim:    true,
            default: '',
        },
        epps: [kitEppSchema],
        active: {
            type:    Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

kitSchema.index({ active: 1, name: 1 });

const Kit = mongoose.model('Kit', kitSchema);

export default Kit;
