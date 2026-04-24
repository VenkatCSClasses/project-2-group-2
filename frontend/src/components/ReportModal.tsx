import './ReportModal.css'

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
}

export default function ReportModal({ isOpen, onClose, onSubmit, title }: ReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <form onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const reason = fd.get('reason') as string;
          onSubmit(reason);
        }}>
          <textarea
            className='report-reason'
            name="reason" 
            placeholder="Why are you reporting this (optional)?" 
            maxLength={256}
            autoFocus
          />
          <div className="report-modal-actions">
            <button type="button" className="report-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="report-modal-submit">
              Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
