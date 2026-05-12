interface Props {
  status: 'pending' | 'approved' | 'rejected'
}

const labels = {
  pending: '申請中',
  approved: '承認済',
  rejected: '却下',
}
const styles = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
