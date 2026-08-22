export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LEAVE: 'leave',
  ABSENT: 'absent',
};

export const ATTENDANCE_STATUS_LABEL = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.LEAVE]: 'On Leave',
  [ATTENDANCE_STATUS.ABSENT]: 'Absent',
};

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Product',
  'People Ops',
  'Sales',
  'Marketing',
  'Finance',
];

export const EMPLOYMENT_STATUS = ['Active', 'On Probation', 'Inactive'];

export const TIME_OFF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const TIME_OFF_STATUS_LABEL = {
  [TIME_OFF_STATUS.PENDING]: 'Pending',
  [TIME_OFF_STATUS.APPROVED]: 'Approved',
  [TIME_OFF_STATUS.REJECTED]: 'Rejected',
};

export const TIME_OFF_TYPES = ['Vacation', 'Sick Leave', 'Personal', 'Bereavement', 'Unpaid'];
