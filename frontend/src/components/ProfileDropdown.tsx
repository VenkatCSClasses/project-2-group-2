import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileDropdown.css'
import { jwtDecode } from 'jwt-decode'
import { getAvatarLetter, resolveProfileImageSrc } from './feed/utils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface TokenInfo {
  user_id: string
  role: string
  token_type: string
  exp: number
}

interface ProfileDropdownProps {
  currentUserPfp: string | null
  username: string
  onOpenProfile: (username: string) => void
  onOpenReportedPosts?: () => void
  token: string
}

export default function ProfileDropdown({ currentUserPfp, username, onOpenProfile, onOpenReportedPosts, token }: ProfileDropdownProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const tokenInfo = jwtDecode<TokenInfo>(token)
  const currentUserAvatarSrc = resolveProfileImageSrc(currentUserPfp, API_BASE_URL)

  return (
    <div className="profile-menu-container">
      <button
        className="profile-button"
        type="button"
        aria-label="Profile Menu"
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
      >
        {currentUserAvatarSrc ? (
          <img
            src={currentUserAvatarSrc}
            alt="Profile"
            className="profile-circle-img"
          />
        ) : (
          <div className="profile-circle">{getAvatarLetter(username)}</div>
        )}
      </button>

      {isProfileMenuOpen && (
        <div className="profile-dropdown-menu">
          <button className="profile-dropdown-item" type="button"
            onClick={() => {
              setIsProfileMenuOpen(false)
              if (username) {
                onOpenProfile(username)
              }
            }}
          >
            Profile
          </button>
          {tokenInfo && (tokenInfo.role === 'moderator' || tokenInfo.role === 'admin') && (
            <button className="profile-dropdown-item" type="button"
              onClick={() => {
                setIsProfileMenuOpen(false)
                if (onOpenReportedPosts) onOpenReportedPosts()
              }}
            >
              Reported Posts
            </button>
          )}

          <button className="profile-dropdown-item" type="button"
            onClick={() => {
              setIsProfileMenuOpen(false)
              navigate('/logout')
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}