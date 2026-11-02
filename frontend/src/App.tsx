import {
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

import IncidenciaDetallePage from './pages/IncidenciaDetallePage'
import MantenimientoDetallePage from './pages/MantenimientoDetallePage'

import ForbiddenPage from './pages/ForbiddenPage'

import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'


function App() {

  return (

    <Routes>


      {/* =========================
          LOGIN
      ========================== */}

      <Route
        path="/login"
        element={<LoginPage />}
      />


      {/* =========================
          RUTAS AUTENTICADAS
      ========================== */}

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              permiso="dashboard.leer"
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />


        {/* UNIDADES */}

        <Route
          path="/unidades"
          element={
            <ProtectedRoute
              permiso="unidad.leer"
            >
              <UnidadesPage />
            </ProtectedRoute>
          }
        />


        {/* INCIDENCIAS */}

        <Route
          path="/incidencias"
          element={
            <ProtectedRoute
              permiso="incidencia.leer"
            >
              <IncidenciasPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/incidencias/:id"
          element={
            <ProtectedRoute
              permiso="incidencia.leer"
            >
              <IncidenciaDetallePage />
            </ProtectedRoute>
          }
        />


        {/* MANTENIMIENTO */}

        <Route
          path="/mantenimiento"
          element={
            <ProtectedRoute
              permiso="mantenimiento.leer"
            >
              <MantenimientoPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/mantenimiento/:id"
          element={
            <ProtectedRoute
              permiso="mantenimiento.leer"
            >
              <MantenimientoDetallePage />
            </ProtectedRoute>
          }
        />


        {/* ÓRDENES DE TRABAJO */}

        <Route
          path="/ordenes-trabajo"
          element={
            <ProtectedRoute
              permiso="orden.leer"
            >
              <OrdenesPage />
            </ProtectedRoute>
          }
        />


        {/* ALMACÉN */}

        <Route
          path="/almacen"
          element={
            <ProtectedRoute
              permiso="inventario.leer"
            >
              <AlmacenPage />
            </ProtectedRoute>
          }
        />


        {/* HISTORIAL */}

        <Route
          path="/historial"
          element={
            <ProtectedRoute
              permiso="historial.leer"
            >
              <HistorialPage />
            </ProtectedRoute>
          }
        />


        {/* REPORTES */}

        <Route
          path="/reportes"
          element={
            <ProtectedRoute
              permiso="reporte.leer"
            >
              <ReportesPage />
            </ProtectedRoute>
          }
        />


        {/* USUARIOS */}

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute
              permiso="usuario.administrar"
            >
              <UsuariosPage />
            </ProtectedRoute>
          }
        />


      </Route>


      {/* =========================
          403
      ========================== */}

      <Route
        path="/403"
        element={<ForbiddenPage />}
      />


      {/* =========================
          REDIRECCIONES
      ========================== */}

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

  )
}

export default App