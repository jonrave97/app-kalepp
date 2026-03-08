import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
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

const Category = mongoose.model('Categories', categorySchema);

export default Category;