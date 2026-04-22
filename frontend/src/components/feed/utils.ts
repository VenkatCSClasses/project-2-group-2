import type { ThreadState, ViewerRole } from "./types";

export function createInitialThreadState(): ThreadState {
  return {
    isOpen: false,
    loaded: false,
    loading: false,
    submitting: false,
    submittingReplyId: null,
    comments: [],
    draft: "",
    replyTargetId: null,
    replyDrafts: {},
    error: "",
  };
}

export function formatTimeAgo(dateString: string): string {
  const created = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return created.toLocaleDateString();
}

export function renderStars(starRating: number): string {
  const fiveStarValue = starRating / 2;
  const fullStars = Math.round(fiveStarValue);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

export function getAvatarLetter(username: string | null): string {
  return (username || "user").charAt(0).toUpperCase();
}

export function viewerCanModerate(viewerRole: ViewerRole): boolean {
  return viewerRole === "moderator" || viewerRole === "admin";
}

export function viewerCanDeleteContent(
  viewerRole: ViewerRole,
  viewerUsername: string,
  authorUsername: string | null
) {
  return (
    viewerCanModerate(viewerRole) ||
    (!!viewerUsername && viewerUsername === authorUsername)
  );
}
