import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Trash2, Ban, RefreshCw } from 'lucide-react';
import FeedPostCard from './feed/FeedPostCard';
import type { Post, ThreadState, VoteSelection, ViewerRole, ReportedPost } from './feed/types';
import { createInitialThreadState } from './feed/utils';
import './ReportedPostsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ReportedPostsPageProps = {
  token: string;
  onBack: () => void;
};

export default function ReportedPostsPage({ token, onBack }: ReportedPostsPageProps) {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [threadStates] = useState<Record<string, ThreadState>>({});

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const fetchReportedPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/posts/reported`, {
        headers: authHeaders,
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage('Failed to load reported posts');
        return;
      }
      setPosts(data.reported_posts || []);
    } catch (err) {
      console.error(err);
      setMessage('Network error loading reported posts');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchReportedPosts();
  }, [fetchReportedPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/delete`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (response.ok) {
        setPosts((current) => current.filter((post) => post.id !== postId));
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  const handleBanUser = async (username: string | null) => {
    if (!username) return;
    if (!window.confirm(`Are you sure you want to ban ${username}?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${username}/ban`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (response.ok) {
        alert(`User ${username} has been banned.`);
        setPosts((current) => current.filter((post) => post.author_username !== username));
      } else {
        alert("Failed to ban user");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  const handleClearReports = async (postId: string) => {
  }

  const handleVote = (_postId: string, _vote: VoteSelection) => {};
  const handleToggleComments = (_postId: string) => {};
  const handleDraftChange = (_postId: string, _value: string) => {};
  const handleReplyDraftChange = (_postId: string, _commentId: string, _value: string) => {};
  const handleReplyToggle = (_postId: string, _commentId: string) => {};
  const handleCloseReply = (_postId: string) => {};
  const handleSubmitComment = (_postId: string, _parentId?: string) => {};
  const handleCommentVote = (_postId: string, _commentId: string, _vote: VoteSelection) => {};
  const handleDeleteComment = (_postId: string, _commentId: string) => {};
  const handleReportComment = (_postId: string, _commentId: string) => {};

  return (
    <div className="reported-posts-page">
      <header className="page-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="icon" />
        </button>
        <h2 className="page-title">Reported Posts</h2>
      </header>

      <main className="reported-posts-content">
        {loading ? (
          <p className="loading-msg">Loading reported posts...</p>
        ) : message ? (
          <p className="error-msg">{message}</p>
        ) : posts.length === 0 ? (
          <p className="empty-msg">No reported posts at this time.</p>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="reported-post-container">
                <div className="card-wrapping-box">
                  <FeedPostCard
                    post={post}
                    apiBaseUrl={API_BASE_URL}
                    thread={threadStates[post.id] ?? createInitialThreadState()}
                    commentCount={post.comment_count ?? 0}
                    viewerRole={'admin' as ViewerRole}
                    viewerUsername={'admin'}
                    onToggleComments={() => handleToggleComments(post.id)}
                    onVote={(vote) => handleVote(post.id, vote)}
                    onDeletePost={() => handleDeletePost(post.id)}
                    onReportPost={() => {}}
                    onDraftChange={(val) => handleDraftChange(post.id, val)}
                    onReplyDraftChange={(cId, val) => handleReplyDraftChange(post.id, cId, val)}
                    onReplyToggle={(cId) => handleReplyToggle(post.id, cId)}
                    onCloseReply={() => handleCloseReply(post.id)}
                    onSubmitComment={(pId) => handleSubmitComment(post.id, pId)}
                    onCommentVote={(cId, vote) => handleCommentVote(post.id, cId, vote)}
                    onDeleteComment={(cId) => handleDeleteComment(post.id, cId)}
                    onReportComment={(cId) => handleReportComment(post.id, cId)}
                  />
                </div>
                <div className="moderator-actions">
                  <button 
                    className="mod-btn suspend-btn" 
                    onClick={() => handleBanUser(post.author_username)}
                    disabled={!post.author_username}
                  >
                    <Ban className="mod-icon" />
                    Ban {post.author_username || 'Unknown'}
                  </button>
                  <button 
                    className="mod-btn delete-btn" 
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="mod-icon" />
                    Delete Post
                  </button>

                  <button
                    className="mod-btn clear-reports-btn"
                    onClick={() => handleClearReports(post.id)}
                  >
                    <RefreshCw className="mod-icon" />
                    Clear Reports
                  </button>
                <p className="report-count">{post.report_count || 0} report(s)</p>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
