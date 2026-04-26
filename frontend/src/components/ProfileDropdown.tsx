import { useEffect, useRef, useState } from 'react'
import defaultProfileIcon from '../assets/default-profile.png'
import './ProfileDropdown.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type ProfileDropdownProps = {
  currentUserPfp: string | null
  onOpenProfile: () => void
  onOpenReportedPosts: () => void
  token: string
}

function ProfileDropdown({
  currentUserPfp,
  onOpenProfile,
  onOpenReportedPosts,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const profileImageSrc = currentUserPfp
    ? currentUserPfp.startsWith('http')
      ? currentUserPfp
      : `${API_BASE_URL}${currentUserPfp}`
    : defaultProfileIcon

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-button"
        type="button"
        aria-label="Profile menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <img
          src={profileImageSrc}
          alt="Profile"
          className="profile-circle-img"
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <button
            type="button"
            className="profile-dropdown-item"
            onClick={() => {
              setIsOpen(false)
              onOpenProfile()
            }}
          >
            View Profile
          </button>

          <button
            type="button"
            className="profile-dropdown-item"
            onClick={() => {
              setIsOpen(false)
              onOpenReportedPosts()
            }}
          >
            Reported Posts
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown