import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import './ProfilePage.css';

import FeedPostCard from './feed/FeedPostCard';
import type { Post, ThreadState, VoteSelection, ViewerRole } from './feed/types';
import { createInitialThreadState } from './feed/utils';
import { collectCommentSubtreeIds } from './feed/commentThread';


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

  // Posts specific state
  const [posts, setPosts] = useState<Post[]>([]);
  const [threadStates, setThreadStates] = useState<Record<string, ThreadState>>({});
  const [postsLoading, setPostsLoading] = useState(false);

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


  const loadUserPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/me/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadUserPosts();
    }
  }, [profile]);

  // Replicated Feed logic for standard interactions
  function updateThreadState(postId: string, updater: (current: ThreadState) => ThreadState) {
    setThreadStates((current) => ({
      ...current,
      [postId]: updater(current[postId] ?? createInitialThreadState()),
    }));
  }

  function getThread(postId: string): ThreadState {
    return threadStates[postId] ?? createInitialThreadState();
  }

  function updatePostCommentCount(postId: string, commentCount: number) {
    setPosts((current) =>
      current.map((p) => (p.id === postId ? { ...p, comment_count: commentCount } : p))
    );
  }

  async function loadPostDetails(postId: string) {
    updateThreadState(postId, (c) => ({ ...c, loading: true, error: '' }));
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        updateThreadState(postId, (c) => ({ ...c, loading: false, error: 'Could not load' }));
        return;
      }
      const comments = data.comments ?? [];
      updateThreadState(postId, (c) => ({ ...c, loading: false, loaded: true, comments, error: '' }));
      updatePostCommentCount(postId, data.count ?? comments.length);
    } catch (err) {
      updateThreadState(postId, (c) => ({ ...c, loading: false, error: 'Error loading' }));
    }
  }

  async function toggleComments(postId: string) {
    const thread = getThread(postId);
    if (!thread.isOpen && !thread.loaded && !thread.loading) {
      await loadPostDetails(postId);
    }
    updateThreadState(postId, (c) => ({ ...c, isOpen: !c.isOpen }));
  }

  async function handleVote(postId: string, vote: VoteSelection) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote }),
      });
      if (response.ok) {
        const data = await response.json();
        setPosts((current) =>
          current.map((p) =>
            p.id === postId ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes, viewer_vote: data.viewer_vote } : p
          )
        );
      }
    } catch (e) {}
  }

  async function handleCommentVote(postId: string, commentId: string, vote: VoteSelection) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote }),
      });
      if (response.ok) {
        const data = await response.json();
        updateThreadState(postId, (c) => ({
          ...c,
          comments: c.comments.map((cm) =>
            cm.id === commentId ? { ...cm, upvotes: data.upvotes, downvotes: data.downvotes, viewer_vote: data.viewer_vote } : cm
          ),
        }));
      }
    } catch (e) {}
  }

  async function handleDeletePost(postId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setPosts((current) => current.filter((p) => p.id !== postId));
      }
    } catch (e) {}
  }

  async function handleReportPost(postId: string) {
    try {
      await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Post reported successfully');
    } catch (e) {}
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/comments/${commentId}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        updateThreadState(postId, (c) => {
          const idsToRemove = new Set(collectCommentSubtreeIds(c.comments, commentId));
          const newComments = c.comments.filter((cm) => !idsToRemove.has(cm.id));
          return { ...c, comments: newComments };
        });
        updatePostCommentCount(postId, Math.max(0, getThread(postId).comments.length - 1));
      }
    } catch (e) {}
  }

  async function handleReportComment(_postId: string, commentId: string) {
    try {
      await fetch(`${API_BASE_URL}/posts/comments/${commentId}/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Comment reported');
    } catch (e) {}
  }

  async function submitComment(postId: string, parentId?: string) {
    const thread = getThread(postId);
    const content = parentId ? thread.replyDrafts[parentId]?.trim() : thread.draft.trim();
    if (!content) return;

    updateThreadState(postId, (c) => ({ ...c, submitting: true, submittingReplyId: parentId ?? null, error: '' }));

    try {
      const params = new URLSearchParams({ comment: content });
      if (parentId) {
        params.set('parent_id', parentId);
      }

      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/comment?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to post');
      const data = await response.json();

      updateThreadState(postId, (c) => ({
        ...c,
        submitting: false,
        submittingReplyId: null,
        comments: [...c.comments, data.comment],
        draft: parentId ? c.draft : '',
        replyDrafts: parentId ? { ...c.replyDrafts, [parentId]: '' } : c.replyDrafts,
        replyTargetId: parentId ? null : c.replyTargetId,
      }));
      updatePostCommentCount(postId, getThread(postId).comments.length + 1);
    } catch (e) {
      updateThreadState(postId, (c) => ({ ...c, submitting: false, submittingReplyId: null, error: 'Error posting' }));
    }
  }


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
          <ArrowLeft size={20} /> Back
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
                  <button className="edit-icon-btn" aria-label="Edit username" onClick={() => handleEditClick('username')}><Pencil size={16} /></button>
                </div>
              </div>
              
              <div className="profile-row">
                <div className="profile-label">Email</div>
                <div className="profile-val">
                  <span>{profile.email}</span>
                  <button className="edit-icon-btn" aria-label="Edit email" onClick={() => handleEditClick('email')}><Pencil size={16} /></button>
                </div>
              </div>

              <div className="profile-row">
                <div className="profile-label">Password</div>
                <div className="profile-val">
                  <span>••••••••</span>
                  <button className="edit-icon-btn" aria-label="Edit password" onClick={() => handleEditClick('password')}><Pencil size={16} /></button>
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
          {postsLoading ? (
            <div className="reviews-placeholder"><p>Loading posts...</p></div>
          ) : posts.length === 0 ? (
            <div className="reviews-placeholder"><p>You haven't posted any reviews yet.</p></div>
          ) : (
            <div className="feed-posts">
              {posts.map((post) => {
                const thread = getThread(post.id);
                return (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    apiBaseUrl={API_BASE_URL}
                    thread={thread}
                    commentCount={post.comment_count ?? 0}
                    viewerRole={profile?.role as ViewerRole}
                    viewerUsername={profile?.username || ''}
                    onToggleComments={() => void toggleComments(post.id)}
                    onVote={(vote) => void handleVote(post.id, vote)}
                    onDeletePost={() => void handleDeletePost(post.id)}
                    onReportPost={() => void handleReportPost(post.id)}
                    onDraftChange={(val) => updateThreadState(post.id, (c) => ({ ...c, draft: val }))}
                    onReplyDraftChange={(cmtId, val) => updateThreadState(post.id, (c) => ({ ...c, replyDrafts: { ...c.replyDrafts, [cmtId]: val } }))}
                    onReplyToggle={(cmtId) => updateThreadState(post.id, (c) => ({ ...c, replyTargetId: c.replyTargetId === cmtId ? null : cmtId }))}
                    onCloseReply={() => updateThreadState(post.id, (c) => ({ ...c, replyTargetId: null }))}
                    onSubmitComment={(parentId) => void submitComment(post.id, parentId)}
                    onCommentVote={(cmtId, vote) => void handleCommentVote(post.id, cmtId, vote)}
                    onDeleteComment={(cmtId) => void handleDeleteComment(post.id, cmtId)}
                    onReportComment={(cmtId) => void handleReportComment(post.id, cmtId)}
                  />
                );
              })}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

export default ProfilePage;