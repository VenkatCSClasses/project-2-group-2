import { useState } from 'react'
import './ProfileDropdown.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface ProfileDropdownProps {
  currentUserPfp: string | null
  onOpenProfile: () => void
}

export default function ProfileDropdown({ currentUserPfp, onOpenProfile }: ProfileDropdownProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  return (
    <div className="profile-menu-container">
      <button
        className="profile-button"
        type="button"
        aria-label="Profile Menu"
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
      >
        {currentUserPfp ? (
          <img
            src={
              currentUserPfp.startsWith('http')
                ? currentUserPfp
                : `${API_BASE_URL}${currentUserPfp}`
            }
            alt="Profile"
            className="profile-circle-img"
          />
        ) : (
          <span className="profile-circle">👤</span>
        )}
      </button>

      {isProfileMenuOpen && (
        <div className="profile-dropdown-menu">
          <button className="profile-dropdown-item" type="button"
            onClick={() => {
              setIsProfileMenuOpen(false)
              onOpenProfile()
            }}
          >
            Profile
          </button>
          <button className="profile-dropdown-item" type="button"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            Reported Posts
          </button>

          <button className="profile-dropdown-item" type="button"
            onClick={() => {
              localStorage.removeItem('accessToken')
              window.location.reload()
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
