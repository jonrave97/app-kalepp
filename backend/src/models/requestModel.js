import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const eppItemSchema = new Schema(
    {
        epp:      { type: Types.ObjectId, ref: 'Epps', required: true },
        quantity: { type: Number, required: true, min: [1, 'La cantidad debe ser mayor a 0'] },
    },
    { _id: false }
);

const requestSchema = new Schema(
    {
        code: {
            type: Number,
            unique: true,
        },
        employee: {
            type: Types.ObjectId,
            ref: 'User',
            required: [true, 'El empleado es obligatorio'],
        },
        position: {
            type: String,
            trim: true,
        },
        warehouse: {
            type: Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'La bodega es obligatoria'],
        },
        reason: {
            type: String,
            required: [true, 'El motivo es obligatorio'],
            enum: {
                values: ['Nuevo Requerimiento', 'Reposición', 'Deterioro', 'Pérdida'],
                message: 'Motivo no válido',
            },
        },
        epps: {
            type: [eppItemSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'Debe incluir al menos un EPP en la solicitud',
            },
        },
        status: {
            type: String,
            default: 'Pendiente',
            enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Entregada'],
        },
        stock: {
            type: String,
            enum: ['Con Stock', 'Sin Stock'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        approveDate: {
            type: Date,
        },
        deliveryDate: {
            type: Date,
        },
        approver: {
            type: Types.ObjectId,
            ref: 'User',
        },
        approvalToken: {
            type: String,
        },
        deliveryToken: {
            type: String,
        },
        bosses: [
            {
                _id: { type: Types.ObjectId, ref: 'User' },
            },
        ],
        special: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Generar código correlativo antes de guardar
requestSchema.pre('save', async function (next) {
    if (this.isNew) {
        const last = await this.constructor.findOne({}, { code: 1 }).sort({ code: -1 });
        this.code = last ? last.code + 1 : 1;
    }
    next();
});

const Request = mongoose.model('Request', requestSchema);

export default Request;
