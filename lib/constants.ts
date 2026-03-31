export const LEAVE_TYPES = [
  { value: 'annual',          label: 'Annual Leave',         deductible: true  },
  { value: 'sick',            label: 'Sick Leave',           deductible: false },
  { value: 'maternity',       label: 'Maternity Leave',      deductible: false },
  { value: 'paternity',       label: 'Paternity Leave',      deductible: false },
  { value: 'shared_parental', label: 'Shared Parental',      deductible: false },
  { value: 'compassionate',   label: 'Compassionate Leave',  deductible: false },
  { value: 'unpaid',          label: 'Unpaid Leave',         deductible: false },
  { value: 'toil',            label: 'TOIL',                 deductible: false },
  { value: 'study',           label: 'Study / Training',     deductible: false },
]

export const HOURS_PER_DAY = 8

export function hoursToDisplay(hours: number): string {
  if (hours % HOURS_PER_DAY === 0) return `${hours / HOURS_PER_DAY} day${hours / HOURS_PER_DAY !== 1 ? 's' : ''}`
  if (hours === HOURS_PER_DAY / 2) return '0.5 days'
  return `${hours} hours`
}

export function statusColour(status: string) {
  switch (status) {
    case 'approved':  return 'bg-emerald-100 text-emerald-800'
    case 'rejected':  return 'bg-red-100 text-red-800'
    case 'cancelled': return 'bg-gray-100 text-gray-500'
    default:          return 'bg-amber-100 text-amber-800'
  }
}
