import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'El código es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true,
        trim: true,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

warehouseSchema.index({ disabled: 1, name: 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse;
