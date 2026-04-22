type FeedCommentComposerProps = {
  className?: string
  value: string
  placeholder: string
  submitLabel: string
  submittingLabel: string
  isSubmitting: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  rows?: number
}

function FeedCommentComposer({
  className = 'feed-comment-composer',
  value,
  placeholder,
  submitLabel,
  submittingLabel,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
  rows = 3,
}: FeedCommentComposerProps) {
  return (
    <div className={className}>
      <textarea
        className="feed-comment-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
      />

      <div className="feed-comment-composer-actions">
        {onCancel && (
          <button
            type="button"
            className="secondary-comment-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          className="primary-comment-button"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  )
}

export default FeedCommentComposer
