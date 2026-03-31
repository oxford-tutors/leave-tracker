export const LEAVE_TYPES = [
  { value: 'annual',          label: 'Annual Leave',         deductible: true,  icon: '🌴' },
  { value: 'wfh',             label: 'Work from Home',       deductible: false, icon: '🏠' },
  { value: 'sick',            label: 'Sick Leave',           deductible: false, icon: '🤒' },
  { value: 'maternity',       label: 'Maternity Leave',      deductible: false, icon: '👶' },
  { value: 'paternity',       label: 'Paternity Leave',      deductible: false, icon: '👶' },
  { value: 'shared_parental', label: 'Shared Parental',      deductible: false, icon: '👨‍👩‍👧' },
  { value: 'compassionate',   label: 'Compassionate Leave',  deductible: false, icon: '🕊️' },
  { value: 'unpaid',          label: 'Unpaid Leave',         deductible: false, icon: '📋' },
  { value: 'toil',            label: 'TOIL',                 deductible: false, icon: '⏱️' },
  { value: 'study',           label: 'Study / Training',     deductible: false, icon: '📚' },
]

// Colours for calendar display per leave type
export const LEAVE_COLOURS: Record<string, string> = {
  annual:          'bg-blue-500',
  wfh:             'bg-teal-500',
  sick:            'bg-red-400',
  maternity:       'bg-pink-400',
  paternity:       'bg-purple-400',
  shared_parental: 'bg-purple-500',
  compassionate:   'bg-gray-400',
  unpaid:          'bg-orange-400',
  toil:            'bg-yellow-500',
  study:           'bg-green-500',
}

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
