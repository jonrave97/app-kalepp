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
import WarehouseDetailPage from './pages/WarehouseDetailPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import EppsPage from './pages/EppsPage.tsx';
import NewRequestPage from './pages/NewRequestPage.tsx';
import MyRequestsPage from './pages/MyRequestsPage.tsx';
import NewSpecialRequestPage from './pages/NewSpecialRequestPage.tsx';
import { ProtectedRoute } from './guards/ProtectedRoute.tsx';
import { PublicRoute } from './guards/PublicRoute.tsx';
import { AdminRoute } from './guards/AdminRoute.tsx';


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
              element={<AdminRoute><UsersPage /></AdminRoute>}
            />
            <Route
              path='/admin/positions'
              element={<AdminRoute><PositionsPage /></AdminRoute>}
            />
            <Route
              path='/admin/warehouses'
              element={<AdminRoute><WarehousesPage /></AdminRoute>}
            />
            <Route
              path='/admin/warehouse/:id'
              element={<AdminRoute><WarehouseDetailPage /></AdminRoute>}
            />
            <Route
              path='/admin/categories'
              element={<AdminRoute><CategoriesPage /></AdminRoute>}
            />
            <Route
              path='/admin/epps'
              element={<AdminRoute><EppsPage /></AdminRoute>}
            />
            <Route
              path='/newrequest'
              element={<NewRequestPage />}
            />
            <Route
              path='/requests/new-special'
              element={<NewSpecialRequestPage />}
            />
            <Route
              path='/my-requests'
              element={<MyRequestsPage />}
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
