import express from	'express';
import dotenv from "dotenv";
import cors from "cors";
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import connectDB from './database/db.js';

import userRoutes from './routes/userRoutes.js';
import positionRoutes from './routes/positionRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import eppRoutes from './routes/eppRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

dotenv.config(); // Cargar variables de entorno

const app = express();

// Definicion de URL de Frontend
const whiteList = [process.env.FRONTEND_URL];

// Impresion por consola de la URL del Frontend
console.log('🚀 Frontend URL:', whiteList);

app.use(morgan('dev')); // Middleware para registrar solicitudes HTTP
app.use(express.json()); // Habilitar el parseo de JSON en las solicitudes
app.use(cookieParser()); // Habilitar el parseo de cookies

app.use(cors(
    {
        origin: whiteList, // Configurar el origen permitido
        credentials: true, // Habilitar el envío de cookies y credenciales
    }
));
app.use('/api/users', userRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/epps', eppRoutes);
app.use('/api/requests', requestRoutes);
app.get('/', (req, res) => 
{
	res.send('Backend Funcionando.. !!');
});

connectDB()
    .then(() => {
        // Solo si la conexión es exitosa, iniciar el servidor
        app.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Servidor corriendo en el puerto: ${process.env.PORT || 5000}`);
        });
    })
    .catch(() => {
        // El error ya fue manejado en connectDB()
        // Solo necesitamos este catch para evitar unhandled promise rejection
    });


export default app;