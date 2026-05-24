import mongoose from 'mongoose';
import Counter from '../models/counterModel.js';
import Request from '../models/requestModel.js';

const connectDB = async () => {
    const baseURI = process.env.MONGO_URI;

    if(!baseURI){
        console.error('La variable MONGO_URI no está definida en .env');
        console.error('Deteniendo el servidor...\n');
        process.exit(1);
    }

    try{
        await mongoose.connect(baseURI); 
        console.log('Conectado a la base de datos correctamente');

        // Inicializar contador de solicitudes con el máximo código existente.
        // $setOnInsert garantiza que solo se aplica si el documento NO existe aún,
        // por lo que es seguro ejecutarlo en cada arranque sin sobrescribir el valor actual.
        const maxRequest = await Request.findOne({}, { code: 1 }).sort({ code: -1 });
        await Counter.findOneAndUpdate(
            { _id: 'requestCode' },
            { $setOnInsert: { seq: maxRequest?.code ?? 0 } },
            { upsert: true }
        );
        console.log(`Contador de solicitudes inicializado en: ${maxRequest?.code ?? 0}`);

        // Eventos para manejar descon  exiones después de la conexión inicial
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB desconectado');
        });

        mongoose.connection.on('error', (err) => {
            console.error(' Error en MongoDB:', err.message);
        });

    }catch(error){
        console.error('Error al conectar a la base de datos:', error.message);
        // console.error('Verifica que:');
        // console.error('   1. Tu IP esté registrada en MongoDB Atlas');
        // console.error('   2. La variable MONGO_URI en .env sea correcta');
        // console.error('   3. Tu usuario y contraseña de MongoDB sean válidos');
        // console.error('   4. Tengas conexión a internet');
        // console.error('\n🛑 Deteniendo el servidor...\n');
        
        // Terminar el proceso inmediatamente sin dejar que nodemon lo reinicie
        process.exit(1);
    }
}

export default connectDB;