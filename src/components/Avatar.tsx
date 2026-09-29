import type { User } from '../types'
import { cn, initials } from '../lib/format'

const sizes = { sm: 'size-9 text-xs', md: 'size-10 text-sm', lg: 'size-20 text-2xl md:size-24 md:text-3xl' }

export function Avatar({ user, size = 'md', className }: { user: User; size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white', sizes[size], className)}
      style={{ backgroundColor: user.avatarColor }}
      aria-hidden
    >
      {user.avatarDataUrl ? (
        <img src={user.avatarDataUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(user.firstName, user.lastName)
      )}
    </span>
  )
}
