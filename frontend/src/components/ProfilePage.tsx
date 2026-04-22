import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import './ProfilePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ProfilePageProps = {
  token: string;
  onBack: () => void;
};

type UserProfile = {
  username: string;
  email: string;
  profile_picture?: string;
  role?: string;
};

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

function ProfilePage({ token, onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [editField, setEditField] = useState<'none' | 'username' | 'email' | 'password'>('none');
  const [editValue, setEditValue] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // Only used for change password

  // PFP Cropping state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploadingPfp, setIsUploadingPfp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage('Failed to load profile');
        return;
      }
      setProfile({
        username: data.username,
        email: data.account_info.email,
        profile_picture: data.account_info.profile_picture,
        role: data.account_info.role,
      });
    } catch (err) {
      console.error(err);
      setMessage('Network error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleEditClick = (field: 'username' | 'email' | 'password') => {
    setEditField(field);
    setCurrentPassword('');
    if (field === 'username' && profile) setEditValue(profile.username);
    else if (field === 'email' && profile) setEditValue(profile.email);
    else setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditField('none');
    setEditValue('');
    setCurrentPassword('');
    setMessage('');
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    let url = '';
    let body: any = null;
    let bodyType = 'url';

    if (editField === 'username') {
      url = `${API_BASE_URL}/auth/change-username?new_username=${encodeURIComponent(editValue)}`;
      bodyType = 'empty';
    } else if (editField === 'email') {
      url = `${API_BASE_URL}/auth/change-email?new_email=${encodeURIComponent(editValue)}`;
      bodyType = 'empty';
    } else if (editField === 'password') {
      url = `${API_BASE_URL}/auth/change-password`;
      body = new URLSearchParams({
        username: profile?.username || '',
        current_password: currentPassword,
        new_password: editValue
      });
    }

    try {
      const options: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      if (bodyType === 'url') {
        options.headers = { ...options.headers, 'Content-Type': 'application/x-www-form-urlencoded' };
        options.body = body;
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.detail || data?.message || 'Update failed');
        return;
      }

      setMessage(data.message || 'Updated successfully');
      setEditField('none');
      fetchProfile(); 
    } catch (err) {
      console.error(err);
      setMessage('Network error');
    }
  };

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

  const handleSavePfp = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;
    setIsUploadingPfp(true);
    setMessage('');

    try {
      const blob = await getCroppedImg(uploadedImage, croppedAreaPixels);
      if (!blob) throw new Error('Could not crop image');

      const formData = new FormData();
      formData.append('image', blob, 'profile.jpg');

      const response = await fetch(`${API_BASE_URL}/auth/change-pfp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.detail || data?.message || 'PFP Update failed');
      } else {
        setUploadedImage(null);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error during picture upload');
    } finally {
      setIsUploadingPfp(false);
    }
  };

  if (loading) {
    return <div className="profile-page"><p>Loading profile...</p></div>;
  }

  if (!profile) {
    return <div className="profile-page"><p>Error loading profile.</p><button onClick={onBack}>Go Back</button></div>;
  }

  const pfpSrc = profile.profile_picture 
    ? (profile.profile_picture.startsWith('http') ? profile.profile_picture : `${API_BASE_URL}${profile.profile_picture}`)
    : '';

  return (
    <main className="profile-page">
      <div className="profile-topbar">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>Your Profile</h2>
        <div style={{ width: '60px' }}></div>{/* Spacer for center alignment */}
      </div>

      <div className="profile-content">
        <div className="profile-picture-section">
          <div className="profile-picture-wrapper" onClick={() => fileInputRef.current?.click()}>
            {pfpSrc ? (
              <img src={pfpSrc} alt="Profile" className="profile-img-large" />
            ) : (
              <div className="profile-placeholder-large">{profile.username[0]?.toUpperCase()}</div>
            )}
            <div className="profile-picture-overlay">Change</div>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
        </div>

        {uploadedImage && (
          <div className="pfp-cropper-modal">
            <div className="pfp-cropper-content">
              <h3>Crop Picture</h3>
              <div className="pfp-cropper-workspace">
                <Cropper
                  image={uploadedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="pfp-cropper-actions">
                <button onClick={() => setUploadedImage(null)}>Cancel</button>
                <button className="primary-btn" onClick={handleSavePfp} disabled={isUploadingPfp}>
                  {isUploadingPfp ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {message && <p className="profile-msg">{message}</p>}

        <div className="profile-fields">
          {editField !== 'none' ? (
            <form className="profile-edit-form" onSubmit={handleSubmitEdit}>
              <h3>Change {editField.charAt(0).toUpperCase() + editField.slice(1)}</h3>
              
              {editField === 'password' && (
                <input
                  type="password"
                  placeholder="Enter current password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              )}
              
              <input
                type={editField === 'email' ? 'email' : editField === 'password' ? 'password' : 'text'}
                placeholder={
                  editField === 'username' ? `Example: ${profile.username || 'new_username'}` : 
                  editField === 'email' ? `Example: ${profile.email || 'new@email.com'}` : 
                  'Enter new password'
                }
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />

              <div className="profile-edit-actions">
                <button type="button" onClick={handleCancelEdit}>Cancel</button>
                <button type="submit" className="primary-btn">Save</button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-row">
                <div className="profile-label">Username</div>
                <div className="profile-val">
                  <span>{profile.username}</span>
                  <button className="edit-icon-btn" onClick={() => handleEditClick('username')}>✎</button>
                </div>
              </div>
              
              <div className="profile-row">
                <div className="profile-label">Email</div>
                <div className="profile-val">
                  <span>{profile.email}</span>
                  <button className="edit-icon-btn" onClick={() => handleEditClick('email')}>✎</button>
                </div>
              </div>

              <div className="profile-row">
                <div className="profile-label">Password</div>
                <div className="profile-val">
                  <span>••••••••</span>
                  <button className="edit-icon-btn" onClick={() => handleEditClick('password')}>✎</button>
                </div>
              </div>
              
              <div className="profile-row">
                <div className="profile-label">Role</div>
                <div className="profile-val">
                  <span>{profile.role}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-reviews-section">
          <h3>Past Reviews</h3>
          <div className="reviews-placeholder">
            {/* The review card component will be implemented here later */}
            <p>Your past reviews will appear here.</p>
          </div>
        </div>

      </div>
    </main>
  );
}

export default ProfilePage;