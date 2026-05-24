import mongoose from 'mongoose';
import Counter from './counterModel.js';

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
                values: ['Nuevo Requerimiento', 'Reposición', 'Deterioro', 'Pérdida', 'Kit Inicial Trabajador Nuevo'],
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
            enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Entregada', 'Sin Stock', 'Cambios solicitados'],
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
        expectedStockDate: {
            type: Date,
        },
        annulReason: {
            type: String,
            trim: true,
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

// ── Índices para optimizar las consultas más frecuentes ──────────────────────
requestSchema.index({ employee: 1, date: -1 }); // solicitudes por empleado ordenadas por fecha
requestSchema.index({ warehouse: 1, date: -1 }); // solicitudes por bodega ordenadas por fecha
requestSchema.index({ status: 1 });              // filtro por estado (Pendiente, Aprobada, etc.)

// Generar código correlativo antes de guardar — operación atómica con contador dedicado.
// Usa findOneAndUpdate + $inc para garantizar unicidad incluso bajo alta concurrencia.
requestSchema.pre('save', async function (next) {
    if (this.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { _id: 'requestCode' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.code = counter.seq;
    }
    next();
});

const Request = mongoose.model('Request', requestSchema);

export default Request;
