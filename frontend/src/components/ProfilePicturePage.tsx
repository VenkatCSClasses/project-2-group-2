import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import './ProfilePicturePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ProfilePicturePageProps {
  token: string;
  onComplete: () => void;
}

function ProfilePicturePage({ token, onComplete }: ProfilePicturePageProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setUploadedImage(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const submitPfp = async (imageBlob: Blob | null) => {
    if (!imageBlob) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'profile.jpg');

      const response = await fetch(`${API_BASE_URL}/auth/change-pfp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data?.detail || data?.message || 'Upload failed');
        setIsSubmitting(false);
        return;
      }

      onComplete();
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error');
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (uploadedImage && croppedAreaPixels) {
      const blob = await getCroppedImg(uploadedImage, croppedAreaPixels);
      await submitPfp(blob);
    } else {
      alert("Please upload and crop a picture, or skip.");
    }
  };

  const handleSkip = () => {
    submitPfp(null);
  };

  return (
    <main className="pfp-page-wrapper">
      <div className="pfp-card">
        <div className="pfp-page-container">
          <h2>
            Add a Profile Picture
          </h2>
          <div className="pfp-optional">This step is completely optional</div>

          {/* --- UPLOAD CUSTOM PICTURE SECTION --- */}
          <div className="upload-section">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          Upload Picture
        </button>

        {uploadedImage && (
          <div className="cropper-container">
            <div className="crop-workspace">
              <Cropper
                image={uploadedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}          /* Forces a square crop */
                cropShape="round"   /* Displays a circle overlay to simulate a profile picture */
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="slider-container">
              <label>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
            </div>
          </div>
        )}
      </div>

      {errorMsg && <p className="error-message" style={{color:'red'}}>{errorMsg}</p>}

      <div className="action-buttons">
        <button className="save-btn" onClick={handleSave} disabled={isSubmitting || !uploadedImage}>
          {isSubmitting ? 'Saving...' : 'Save Picture'}
        </button>
        <button className="skip-btn" onClick={handleSkip} disabled={isSubmitting}>
          {isSubmitting ? 'Skipping...' : 'Skip for now'}
        </button>
      </div>
    </div>
    </div>
    </main>
  );
}

export default ProfilePicturePage;