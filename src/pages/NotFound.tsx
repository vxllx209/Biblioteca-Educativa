import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/States'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function NotFound() {
  const { isAuthenticated } = useAuth()
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-6">
      <EmptyState
        icon={Compass}
        title={t('Página no encontrada')}
        description={t('La página que buscas no existe o fue movida.')}
        action={
          <Link to={isAuthenticated ? '/home' : '/welcome'} className="btn-primary">
            {t('Volver al inicio')}
          </Link>
        }
      />
    </main>
  )
}
