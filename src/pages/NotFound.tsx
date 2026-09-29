import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { isAuthenticated } = useAuth()
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-6">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La página que buscas no existe o fue movida."
        action={
          <Link to={isAuthenticated ? '/home' : '/welcome'} className="btn-primary">
            Volver al inicio
          </Link>
        }
      />
    </main>
  )
}
