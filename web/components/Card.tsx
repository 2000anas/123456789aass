import type { CSSProperties, ReactNode } from 'react';

export function Card({
  title,
  children,
  className = '',
  action,
  style,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          {title ? <h3 className="card-title" style={{ margin: 0 }}>{title}</h3> : <span />}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card stat-card fade-up" style={accent ? ({ ['--brand' as string]: accent } as never) : undefined}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
