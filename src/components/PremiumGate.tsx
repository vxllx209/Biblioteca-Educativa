import { Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from './Modal'
import { t } from '../i18n'

/** Shown when a free user tries to use premium-only content. */
export function PremiumGate({ open, onClose, message }: { open: boolean; onClose: () => void; message: string }) {
  const navigate = useNavigate()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Contenido Premium')}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            {t('Ahora no')}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onClose()
              navigate('/premium')
            }}
          >
            {t('Ver planes')}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft text-accent">
          <Crown className="size-6" aria-hidden />
        </span>
        <p className="text-[15px] text-muted">{message}</p>
      </div>
    </Modal>
  )
}
