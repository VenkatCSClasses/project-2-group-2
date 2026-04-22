import { useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { useDismissibleLayer } from './useDismissibleLayer'

type FeedActionMenuProps = {
  menuLabel: string
  actionLabel: string
  onAction: () => void
  className?: string
  triggerClassName?: string
  danger?: boolean
}

function FeedActionMenu({
  menuLabel,
  actionLabel,
  onAction,
  className = 'feed-overflow-menu',
  triggerClassName = 'overflow-trigger',
  danger = false,
}: FeedActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useDismissibleLayer<HTMLDivElement>(isOpen, () =>
    setIsOpen(false)
  )

  return (
    <div className={className} ref={menuRef}>
      <button
        className={triggerClassName}
        type="button"
        aria-label={menuLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Ellipsis className="overflow-icon" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="overflow-menu-panel" role="menu">
          <button
            className={`overflow-menu-item ${
              danger ? 'overflow-menu-item-danger' : ''
            }`}
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              onAction()
            }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default FeedActionMenu
