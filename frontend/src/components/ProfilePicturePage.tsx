import { useState } from 'react'
import type { ChangeEvent } from 'react'
import ProfilePictureCropper from './profile-picture/ProfilePictureCropper'
import type {
  CropArea,
  CropPoint,
  ProfilePicturePageProps,
} from './profile-picture/types'
import { getCroppedImg } from '../utils/cropImage'
import './ProfilePicturePage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function ProfilePicturePage({ token, onComplete }: ProfilePicturePageProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<CropPoint>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setUploadedImage(reader.result?.toString() || null)
    })
    reader.readAsDataURL(file)
  }

  async function submitProfilePicture(imageBlob: Blob | null) {
    if (!imageBlob) {
      onComplete()
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('image', imageBlob, 'profile.jpg')

      const response = await fetch(`${API_BASE_URL}/auth/change-pfp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMsg(data?.detail || data?.message || 'Upload failed')
        setIsSubmitting(false)
        return
      }

      onComplete()
    } catch (error) {
      console.error(error)
      setErrorMsg('Network error')
      setIsSubmitting(false)
    }
  }

  async function handleSave() {
    if (!uploadedImage || !croppedAreaPixels) {
      setErrorMsg('Please upload and crop a picture, or skip.')
      return
    }

    const blob = await getCroppedImg(uploadedImage, croppedAreaPixels)
    await submitProfilePicture(blob)
  }

  return (
    <main className="pfp-page-wrapper">
      <div className="pfp-card">
        <div className="pfp-page-container">
          <h2>Add a Profile Picture</h2>
          <div className="pfp-optional">This step is completely optional</div>

          <ProfilePictureCropper
            uploadedImage={uploadedImage}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={setCroppedAreaPixels}
            onFileChange={handleFileChange}
          />

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <div className="action-buttons">
            <button
              type="button"
              className="save-btn"
              onClick={() => void handleSave()}
              disabled={isSubmitting || !uploadedImage}
            >
              {isSubmitting ? 'Saving...' : 'Save Picture'}
            </button>
            <button
              type="button"
              className="skip-btn"
              onClick={() => void submitProfilePicture(null)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Skipping...' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProfilePicturePage
