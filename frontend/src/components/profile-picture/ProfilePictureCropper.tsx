import { useRef } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import Cropper from 'react-easy-crop'
import type { CropArea, CropPoint } from './types'

type ProfilePictureCropperProps = {
  uploadedImage: string | null
  crop: CropPoint
  zoom: number
  onCropChange: (crop: CropPoint) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (croppedAreaPixels: CropArea) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function HiddenFileInput({
  fileInputRef,
  onFileChange,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={onFileChange}
      style={{ display: 'none' }}
    />
  )
}

function ProfilePictureCropper({
  uploadedImage,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onFileChange,
}: ProfilePictureCropperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="upload-section">
      <HiddenFileInput fileInputRef={fileInputRef} onFileChange={onFileChange} />

      <button
        type="button"
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload Picture
      </button>

      {uploadedImage && (
        <div className="cropper-container">
          <div className="crop-workspace">
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onCropComplete={(_, croppedAreaPixels) =>
                onCropComplete(croppedAreaPixels as CropArea)
              }
              onZoomChange={onZoomChange}
            />
          </div>

          <div className="slider-container">
            <label htmlFor="zoom-slider">Zoom</label>
            <input
              id="zoom-slider"
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-label="Zoom"
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="zoom-slider"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePictureCropper
