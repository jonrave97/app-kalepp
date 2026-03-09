import { AuthProvider } from './context/Authcontext.tsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage.tsx'; //Pagina del login
import NotFoundPage from './common/NotFoundPage.tsx';
import ForgotPassword from './pages/auth/ForgotPasswordPage.tsx';
import AppLayout from './components/template/appLayout.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import PositionsPage from './pages/PositionsPage.tsx';
import UsersPage from './pages/UsersPage.tsx';
import WarehousesPage from './pages/WarehousesPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import EppsPage from './pages/EppsPage.tsx';
import NewRequestPage from './pages/NewRequestPage.tsx';
import { ProtectedRoute } from './guards/ProtectedRoute.tsx';
import { PublicRoute } from './guards/PublicRoute.tsx';


// import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path='/'
            element={<Navigate to="/login" replace />}
          />
          {/* Definimos ruta pública para login */}
          <Route
            path='/login'
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          {/* Definimos ruta pública para recuperar contraseña */}
          <Route
            path='/forgot-password'
            element={<ForgotPassword />}
          />

          {/*Layout protegido - protege todas las rutas hijas */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Definimos rutas protegidas con layout */}
            <Route
              path='/dashboard'
              element={<DashboardPage />}
            />
            <Route 
              path='/admin/users'
              element={<UsersPage />}
            />
            <Route
              path='/admin/positions'
              element={<PositionsPage />}
            />
            <Route
              path='/admin/warehouses'
              element={<WarehousesPage />}
            />
            <Route
              path='/admin/categories'
              element={<CategoriesPage />}
            />
            <Route
              path='/admin/epps'
              element={<EppsPage />}
            />
            <Route
              path='/newrequest'
              element={<NewRequestPage />}
            />

            {/*My Profile */}
            <Route
              path='/profile'
              element={<ProfilePage />}
            />
          </Route>



          {/* Ruta para manejar páginas no encontradas */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
