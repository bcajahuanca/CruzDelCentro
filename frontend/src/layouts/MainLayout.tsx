import { Outlet } from 'react-router-dom'
import { useState } from 'react'

import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

import '../styles/layout.css'

function MainLayout() {

  const [
    sidebarAbierto,
    setSidebarAbierto
  ] = useState(false)

  return (
    <div className="app-layout">

      <Sidebar
        abierto={sidebarAbierto}
        cerrar={() =>
          setSidebarAbierto(false)
        }
      />

      <div className="main-area">

        <Topbar
          abrirSidebar={() =>
            setSidebarAbierto(
              !sidebarAbierto
            )
          }
        />

        <main className="main-content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default MainLayout