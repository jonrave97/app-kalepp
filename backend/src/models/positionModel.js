import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    epps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Epps'
    }]
}, {
    timestamps: true // Agrega createdAt y updatedAt automáticamente
});

const Position = mongoose.model('Position', positionSchema);

export default Position;
