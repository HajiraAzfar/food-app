const STYLES = {
  pending:          { label: 'New',         cls: 'bg-honey-bg text-honey-ink' },
  accepted:         { label: 'Accepted',    cls: 'bg-sage-100 text-sage-700' },
  preparing:        { label: 'Preparing',   cls: 'bg-sage-100 text-sage-700' },
  out_for_delivery: { label: 'On the way',  cls: 'bg-sage-200 text-sage-700' },
  delivered:        { label: 'Delivered',   cls: 'bg-sage-500 text-white' },
  rejected:         { label: 'Declined',    cls: 'bg-clay-bg text-clay-ink' },
  cancelled:        { label: 'Cancelled',   cls: 'bg-clay-bg text-clay-ink' },
};

export default function StatusChip({ status, size = 'sm' }) {
  const s = STYLES[status] || { label: status, cls: 'bg-sage-50 text-muted' };
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-block shrink-0 rounded-full font-semibold ${pad} ${s.cls}`}>
      {s.label}
    </span>
  );
}