import mongoose from "mongoose";
import generateToken from '../helpers/generateToken.js';

const userSchema = mongoose.Schema
({
	name: {
        type: String,       
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Formato de email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        trim: true,
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        maxlength: [100, 'La contraseña no puede exceder 100 caracteres']
    },
    rol: {
        type: String,
        required: true,
        trim: true,
    },
    token:{
    	type: String,
        trim: true,
        default: () => generateToken()
    },
    confirmed:{
        type: Boolean,
        default: false
    },
    position:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    bosses: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    warehouses: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    sizes: {
        footwear: {
            type: String,
            trim: true
        },
        gloves: {
            type: String,
            trim: true
        },
        pants: {
            letter: {
                type: String,
                trim: true
            },
            number: {
                type: String,
                trim: true
            }
        },
        shirtJacket: {
            type: String,
            trim: true
        }
    }
});

const User = mongoose.model('User', userSchema);
export default User;