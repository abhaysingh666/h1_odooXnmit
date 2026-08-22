// Mock employee data.
// This file exists ONLY so the UI has something to render before a backend
// is connected. Replace `services/employeeService.js` internals with real
// API calls; nothing outside that file should import from here directly.

let employees = [
  {
    id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+91 98765 43210',
    dob: '1994-03-12',
    avatar: null,
    designation: 'Software Engineer',
    department: 'Engineering',
    joiningDate: '2022-06-15',
    location: 'Bangalore',
    manager: 'Priya Nair',
    employmentStatus: 'Active',
    status: 'present',
  },
  {
    id: 'EMP002',
    name: 'Aisha Khan',
    email: 'aisha.khan@company.com',
    phone: '+91 98765 43211',
    dob: '1996-07-22',
    avatar: null,
    designation: 'Product Designer',
    department: 'Design',
    joiningDate: '2023-01-09',
    location: 'Mumbai',
    manager: 'Rahul Verma',
    employmentStatus: 'Active',
    status: 'leave',
  },
  {
    id: 'EMP003',
    name: 'Rahul Verma',
    email: 'rahul.verma@company.com',
    phone: '+91 98765 43212',
    dob: '1990-11-02',
    avatar: null,
    designation: 'Design Lead',
    department: 'Design',
    joiningDate: '2020-02-18',
    location: 'Mumbai',
    manager: 'Sunita Rao',
    employmentStatus: 'Active',
    status: 'present',
  },
  {
    id: 'EMP004',
    name: 'Priya Nair',
    email: 'priya.nair@company.com',
    phone: '+91 98765 43213',
    dob: '1989-05-30',
    avatar: null,
    designation: 'Engineering Manager',
    department: 'Engineering',
    joiningDate: '2019-08-05',
    location: 'Bangalore',
    manager: 'Sunita Rao',
    employmentStatus: 'Active',
    status: 'present',
  },
  {
    id: 'EMP005',
    name: 'Vikram Singh',
    email: 'vikram.singh@company.com',
    phone: '+91 98765 43214',
    dob: '1997-01-14',
    avatar: null,
    designation: 'QA Engineer',
    department: 'Engineering',
    joiningDate: '2023-09-20',
    location: 'Pune',
    manager: 'Priya Nair',
    employmentStatus: 'Active',
    status: 'absent',
  },
  {
    id: 'EMP006',
    name: 'Meera Iyer',
    email: 'meera.iyer@company.com',
    phone: '+91 98765 43215',
    dob: '1995-09-08',
    avatar: null,
    designation: 'Product Manager',
    department: 'Product',
    joiningDate: '2021-11-01',
    location: 'Bangalore',
    manager: 'Sunita Rao',
    employmentStatus: 'Active',
    status: 'present',
  },
  {
    id: 'EMP007',
    name: 'Arjun Reddy',
    email: 'arjun.reddy@company.com',
    phone: '+91 98765 43216',
    dob: '1998-12-19',
    avatar: null,
    designation: 'People Ops Associate',
    department: 'People Ops',
    joiningDate: '2024-03-11',
    location: 'Hyderabad',
    manager: 'Sunita Rao',
    employmentStatus: 'Active',
    status: 'leave',
  },
  {
    id: 'EMP008',
    name: 'Sunita Rao',
    email: 'sunita.rao@company.com',
    phone: '+91 98765 43217',
    dob: '1985-04-27',
    avatar: null,
    designation: 'VP, Operations',
    department: 'People Ops',
    joiningDate: '2018-01-15',
    location: 'Bangalore',
    manager: '—',
    employmentStatus: 'Active',
    status: 'present',
  },
  {
    id: 'EMP009',
    name: 'Karan Malhotra',
    email: 'karan.malhotra@company.com',
    phone: '+91 98765 43218',
    dob: '1993-02-25',
    avatar: null,
    designation: 'Sales Executive',
    department: 'Sales',
    joiningDate: '2022-10-03',
    location: 'Delhi',
    manager: 'Neha Kapoor',
    employmentStatus: 'Active',
    status: 'absent',
  },
];

export function _getAll() {
  return employees;
}

export function _getById(id) {
  return employees.find((e) => e.id === id) || null;
}

export function _create(employee) {
  employees = [employee, ...employees];
  return employee;
}

export function _updateById(id, patch) {
  employees = employees.map((e) => (e.id === id ? { ...e, ...patch } : e));
  return _getById(id);
}

export function _nextSerial() {
  return employees.length + 1;
}
