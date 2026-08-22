# Dayflow HRMS Frontend

Modern React frontend for Dayflow HRMS with Amethyst Haze theme.

## Features

- ✅ Login with Auto-generated Login IDs
- ✅ Admin Dashboard
- ✅ Create Employee with Registration Token
- ✅ Employee Self-Registration
- ✅ Role-based Access Control
- ✅ Cloudinary Logo Upload
- ✅ Beautiful Amethyst Haze Theme
- ✅ Responsive Design

## Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment

Backend API: `http://localhost:8000`
Frontend Dev: `http://localhost:5173`

## Pages

### Public
- `/login` - Login page (admin + employee)
- `/register?token=...` - Employee registration

### Admin
- `/admin/dashboard` - Admin dashboard
- `/admin/employees/create` - Create employee

### Employee
- `/employee/dashboard` - Employee dashboard

## Login Flow

1. **Admin Login:**
   - Login ID: `DASYAD20260001`
   - Password: From `.env` file

2. **Admin Creates Employee:**
   - Fill form → Get Login ID + Registration Link
   - Share link with employee

3. **Employee Registers:**
   - Click link → Set password → Complete registration

4. **Employee Login:**
   - Use generated Login ID + password

## Theme

Using **Amethyst Haze** theme with:
- Purple primary colors
- Soft pink accents
- Beautiful shadows
- Dark mode support
