function DashboardPage() {

  const usuario = localStorage.getItem('usuario')

  return (
    <div>

      <h1>Dashboard</h1>

      <p>
        Bienvenido, {usuario}
      </p>

    </div>
  )
}

export default DashboardPage