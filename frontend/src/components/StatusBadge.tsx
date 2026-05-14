interface Props {
  status: 'pending' | 'approved' | 'rejected'
}

const config = {
  pending:  { label: '申請中', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { label: '承認済', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: '却下',   cls: 'bg-red-50 text-red-600 ring-red-200' },
}

export default function StatusBadge({ status }: Props) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${cls}`}>
      {label}
    </span>
  )
}
