import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UnidadesPage from './pages/UnidadesPage'
import IncidenciasPage from './pages/IncidenciasPage'
import MantenimientoPage from './pages/MantenimientoPage'
import OrdenesPage from './pages/OrdenesPage'
import AlmacenPage from './pages/AlmacenPage'
import HistorialPage from './pages/HistorialPage'
import ReportesPage from './pages/ReportesPage'
import UsuariosPage from './pages/UsuariosPage'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/unidades"
            element={<UnidadesPage />}
          />

          <Route
            path="/incidencias"
            element={<IncidenciasPage />}
          />

          <Route
            path="/mantenimiento"
            element={<MantenimientoPage />}
          />

          <Route
            path="/ordenes"
            element={<OrdenesPage />}
          />

          <Route
            path="/almacen"
            element={<AlmacenPage />}
          />

          <Route
            path="/historial"
            element={<HistorialPage />}
          />

          <Route
            path="/reportes"
            element={<ReportesPage />}
          />

          <Route
            path="/usuarios"
            element={<UsuariosPage />}
          />

        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App