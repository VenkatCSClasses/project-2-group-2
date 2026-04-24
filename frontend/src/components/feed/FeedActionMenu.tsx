import { useState } from 'react'
import { Ellipsis } from 'lucide-react'
import { useDismissibleLayer } from './useDismissibleLayer'

export type ActionItem = {
  label: string
  danger?: boolean
  onClick: () => void
}

type FeedActionMenuProps = {
  menuLabel: string
  actions: ActionItem[]
  className?: string
  triggerClassName?: string
}

function FeedActionMenu({
  menuLabel,
  actions,
  className = 'feed-overflow-menu',
  triggerClassName = 'overflow-trigger',
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
          {actions.map((action, index) => (
            <button
              key={index}
              className={`overflow-menu-item ${
                action.danger ? 'overflow-menu-item-danger' : ''
              }`}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                action.onClick()
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedActionMenu
