# Northgate HR — Employee Management Dashboard

A React + Vite front end for the post-login Employee Management experience:
Employees dashboard, read-only employee profiles, an editable "My Profile"
page, check-in/check-out, Attendance history, and Time Off requests.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. You'll land on `/login` — any Login ID and
password work, since this repo ships a **placeholder** auth service (see
"Authentication" below). Signing in takes you straight to `/employees`.

## Tech

- React 19 + React Router 7
- Tailwind CSS v4 (tokens defined in `src/index.css`)
- lucide-react icons
- No global state library — React state + Context is enough for this scope

## Project structure

```
src/
├── components/     Reusable UI: Navbar, EmployeeCard, SearchBar, ProfileDropdown,
│                    AttendanceWidget, TimeOff modal, and generic ui/ primitives
├── pages/           One folder per route
├── services/        API-ready functions — the ONLY place that should talk to a backend
├── data/             Mock data stores backing the services during development
├── context/          AuthContext, ToastContext
├── hooks/            useAuth, useToast, useDebounce, useOnClickOutside
└── routes/           ProtectedRoute, GuestRoute
```

## Authentication — read this first

This project was generated without an existing codebase to integrate into
(no repo was supplied, only two wireframe images), so `src/services/authService.js`
and `src/context/AuthContext.jsx` are **placeholders** that let the whole app
run end-to-end. To wire in a real app:

1. Delete `src/services/authService.js`.
2. In `src/context/AuthContext.jsx`, replace the three `authService` calls
   (`getCurrentUser`, `login`, `logout`) with calls into your existing auth
   implementation. The shape `AuthContext` exposes
   (`user`, `isAuthenticated`, `isLoading`, `login`, `logout`, `updateUser`)
   is deliberately generic so nothing else in the app needs to change.
3. `ProtectedRoute` / `GuestRoute` (in `src/routes/`) just read
   `isAuthenticated` — they don't care how it's determined.

## Connecting a real backend

Every network-shaped call in the app goes through `src/services/*.js`. Each
function already has the intended REST call commented directly above its
mock implementation, e.g.:

```js
export async function getEmployees() {
  // return (await fetch('/api/employees')).json();
  return delay(_getAll());
}
```

Replace the mock line with the real `fetch`/`axios` call and delete the
corresponding file in `src/data/`. Nothing in `pages/` or `components/`
imports `src/data/` directly — only the services do.

| Service | File | Backing endpoints (FastAPI-style, adjust as needed) |
|---|---|---|
| Employees | `services/employeeService.js` | `GET /employees`, `GET /employees/{id}`, `POST /employees`, `PUT /employees/{id}` |
| Attendance | `services/attendanceService.js` | `GET /attendance`, `POST /attendance/check-in`, `POST /attendance/check-out` |
| Time Off | `services/timeOffService.js` | `GET /time-off`, `POST /time-off` |
| Auth | `services/authService.js` | `GET /users/me`, `POST /auth/login`, `POST /auth/logout` (placeholder — see above) |

## Routes

```
/login                      guest-only, redirects to /employees if already signed in
/signup                     guest-only
/employees                  protected, default landing page after login
/employees/new              protected, "New Employee" form
/employees/:employeeId      protected, VIEW-ONLY employee profile
/profile                    protected, the logged-in user's own EDITABLE profile
/attendance                 protected
/time-off                   protected
```

`/` always redirects to `/employees`, which itself redirects unauthenticated
visitors to `/login`.

## Notable UX details

- Employee cards are entire `<Link>` elements (not clickable `<div>`s), so
  they work with keyboard navigation and screen readers out of the box.
- The employee details page (`/employees/:employeeId`) never renders an
  `<input>`, `<select>`, or `<textarea>` — it is intentionally read-only,
  as distinct from `/profile`, which is a real editable form.
- Status indicators (green dot / airplane / amber dot) each carry a
  `title` attribute and a visually-hidden label for screen readers.
- Search filters the in-memory employee list by name, ID, department, and
  email, debounced by 200ms.
