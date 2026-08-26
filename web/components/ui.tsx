export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'in' | 'out' | 'present' | 'late' | 'absent' | 'incomplete' | 'neutral' | 'active' | 'inactive';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function LoadingSpinner() {
  return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 40, opacity: 0.35 }}>◌</div>
      <h3>{title}</h3>
      {description ? (
        <p style={{ whiteSpace: 'pre-line', maxWidth: 360, margin: '0 auto' }}>{description}</p>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <span>
        الصفحة {page} من {pages} — الإجمالي {total}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          السابق
        </button>
        <button
          className="btn btn-outline btn-sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          التالي
        </button>
      </div>
    </div>
  );
}
