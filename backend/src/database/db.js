import mongoose from 'mongoose';

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