import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import connectDB from './database/db.js';

import userRoutes from './routes/userRoutes.js';
import positionRoutes from './routes/positionRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import eppRoutes from './routes/eppRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import kitRoutes       from './routes/kitRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes    from './routes/reportRoutes.js';

dotenv.config(); // Cargar variables de entorno

const app = express();

// ── Seguridad: cabeceras HTTP ──────────────────────────────────────────────────
app.use(helmet());

// ── Logging: solo en desarrollo ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    const { default: morgan } = await import('morgan');
    app.use(morgan('dev'));
}
app.use(express.json()); // Habilitar el parseo de JSON en las solicitudes
app.use(cookieParser()); // Habilitar el parseo de cookies

// ── CORS ──────────────────────────────────────────────────────────────────────
const whiteList = [process.env.FRONTEND_URL];
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
app.use('/api/kits',      kitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports',   reportRoutes);
app.get('/', (req, res) =>
{
	res.send('Backend Funcionando.. !!');
});

// ── Manejo global de errores ──────────────────────────────────────────────────
// Captura cualquier error no manejado que llegue con next(err) o errores
// lanzados en middlewares asincrónicos. Debe estar al final, después de todas las rutas.
app.use((err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl} →`, err);
    res.status(err.status || 500).json({
        message: err.message || 'Error interno del servidor',
    });
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