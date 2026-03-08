import mongoose from "mongoose";

const eppSchema = new mongoose.Schema({
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
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    price: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo'] 
    },
    category: {
        type: String,
        required: [true, 'La categoría es obligatoria'],
        trim: true,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Epp = mongoose.model('Epps', eppSchema);

export default Epp;