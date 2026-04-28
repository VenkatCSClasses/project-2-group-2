import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Trash2, Ban, RefreshCw, MessageSquare } from 'lucide-react';
import FeedPostCard from './feed/FeedPostCard';
import type { ThreadState, VoteSelection, ViewerRole, ReportedPost, ReportedComment } from './feed/types';
import { createInitialThreadState } from './feed/utils';
import './ReportedPostsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type ReportedPostsPageProps = {
  token: string;
  onBack: () => void;
};

export default function ReportedPostsPage({ token, onBack }: ReportedPostsPageProps) {
  const [posts, setPosts] = useState<ReportedPost[]>([]);
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [threadStates, setThreadStates] = useState<Record<string, ThreadState>>({});

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
        setMessage('Failed to load reported content');
        return;
      }
      setPosts(Object.values(data.reported_posts || {}));
      setComments(Object.values(data.reported_comments || {}));
    } catch (err) {
      console.error(err);
      setMessage('Network error loading reported content');
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
    if (!window.confirm("Are you sure you want to clear reports for this post?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/clear-reports`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (response.ok) {
        setPosts((current) => current.filter((post) => post.id !== postId));
      } else {
        alert("Failed to clear reports");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  const handleDeleteCommentAdmin = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/comments/${commentId}/delete`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (response.ok) {
        setComments((current) => current.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  const handleClearCommentReportsAdmin = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to clear reports for this comment?")) return;
    try {
      // Create endpoint on backend or let users handle it if it exists. 
      // Ensure backend has: router.post("/comments/{comment_id}/clear-reports")
      const response = await fetch(`${API_BASE_URL}/posts/comments/${commentId}/clear-reports`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (response.ok) {
        setComments((current) => current.filter((c) => c.id !== commentId));
      } else {
        alert("Failed to clear comment reports");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };

  // Implement loading thread state
  const handleToggleComments = async (postId: string) => {
    const thread = threadStates[postId] ?? createInitialThreadState();
    const shouldOpen = !thread.isOpen;

    setThreadStates((prev) => ({
      ...prev,
      [postId]: {
        ...thread,
        isOpen: shouldOpen,
        error: shouldOpen ? thread.error : '',
        replyTargetId: shouldOpen ? thread.replyTargetId : null,
      }
    }));

    if (shouldOpen && !thread.loading) {
      setThreadStates((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], loading: true, error: '' },
      }));

      try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          setThreadStates((prev) => ({
            ...prev,
            [postId]: { ...prev[postId], loading: false, error: 'Could not load comments' },
          }));
          return;
        }

        const comments = data.comments ?? [];
        setThreadStates((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            loading: false,
            comments,
            error: '',
          },
        }));
      } catch {
        setThreadStates((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], loading: false, error: 'Network error loading comments' },
        }));
      }
    }
  };

  const handleVote = (_postId: string, _vote: VoteSelection) => {};
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
      <div className="dining-reviews-shell">
        <header className="dining-reviews-header">
        <button
          type="button"
          className="dining-reviews-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={24} />
        </button>

        <h1 className="dining-reviews-title">Reported Content</h1>
        <div className="header-spacer"></div>
      </header>

      <div className="reports-tabs">
        <div className="reports-selector">
          <button 
            className={`reports-selector-button ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Reported Posts ({posts.length})
          </button>
          <button 
            className={`reports-selector-button ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Reported Comments ({comments.length})
          </button>
        </div>
      </div>

      <main className="reported-posts-content">
        {loading && (
          <p className="loading-msg">Loading reported content...</p>
        )}

        {!loading && message && (
          <p className="error-msg">{message}</p>
        )}

        {!loading && !message && activeTab === 'posts' && (
          posts.length === 0 ? (
            <p className="empty-msg">No reported posts at this time.</p>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <div key={post.id} className="reported-post-container read-only-comments">
                  <div className="card-wrapping-box">
                    <FeedPostCard
                      post={post}
                      apiBaseUrl={API_BASE_URL}
                      thread={threadStates[post.id] ?? createInitialThreadState()}
                      commentCount={post.comment_count ?? 0}
                      viewerRole={'admin' as ViewerRole}
                      viewerUsername={'admin'}
                      authorPfp={post.author_pfp_url}
                      showPlaceName
                      placeName={post.food_place_name}
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
                  
                  {post.reports && post.reports.length > 0 && (
                    <div className="reports-reasons-list">
                      <h4>Report Reasons:</h4>
                      <ul>
                        {post.reports.map((report) => (
                          <li key={report.id}>
                            <span className="report-reason">
                              {report.reason && report.reason.trim().length > 0 ? (
                                report.reason
                              ) : (
                                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No reason given</span>
                              )}
                            </span>
                            <span className="report-date">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {!loading && !message && activeTab === 'comments' && (
          comments.length === 0 ? (
            <p className="empty-msg">No reported comments at this time.</p>
          ) : (
            <div className="posts-list">
              {comments.map((comment) => (
                <div key={comment.id} className="reported-post-container reported-comment-container">
                  <div className="comment-content-preview">
                    <MessageSquare size={20} className="comment-preview-icon" />
                    <div>
                      <p className="comment-author">
                        <strong>{comment.author_username}</strong> commented:
                      </p>
                      <p className="comment-text">"{comment.text}"</p>
                    </div>
                  </div>
                  
                  <div className="moderator-actions">
                    <button 
                      className="mod-btn suspend-btn" 
                      onClick={() => handleBanUser(comment.author_username)}
                      disabled={!comment.author_username}
                    >
                      <Ban className="mod-icon" />
                      Ban {comment.author_username || 'Unknown'}
                    </button>
                    <button 
                      className="mod-btn delete-btn" 
                      onClick={() => handleDeleteCommentAdmin(comment.id)}
                    >
                      <Trash2 className="mod-icon" />
                      Delete Comment
                    </button>

                    <button
                      className="mod-btn clear-reports-btn"
                      onClick={() => handleClearCommentReportsAdmin(comment.id)}
                    >
                      <RefreshCw className="mod-icon" />
                      Clear Reports
                    </button>
                    <p className="report-count">{comment.report_count || 0} report(s)</p>
                  </div>
                  
                  {comment.reports && comment.reports.length > 0 && (
                    <div className="reports-reasons-list">
                      <h4>Report Reasons:</h4>
                      <ul>
                        {comment.reports.map((report) => (
                          <li key={report.id}>
                            <span className="report-reason">
                              {report.reason && report.reason.trim().length > 0 ? (
                                report.reason
                              ) : (
                                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No reason given</span>
                              )}
                            </span>
                            <span className="report-date">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </main>
      </div>
    </div>
  );
}
