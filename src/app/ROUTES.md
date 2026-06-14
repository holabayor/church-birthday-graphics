# Route Structure

The app uses Next.js route groups to separate product surfaces without changing public URLs.

- `(auth)` contains public member authentication and onboarding screens:
  - `/login`
  - `/register`
- `(super-admin)` contains the dedicated super-admin authentication surface:
  - `/admin`
  - `/admin/login` redirect
- `(workspace)` contains the authenticated member workspace for members, HODs, assistants, pastors, and permissioned officials:
  - `/`
  - `/profile`
  - `/members`
  - `/attendance`
  - `/units`
  - `/outreach`
  - `/designs`
  - `/settings`
- `api` contains route handlers shared by all surfaces.

Only existing super-admin accounts should use `/admin`. Everyone else signs in through `/login`; the sidebar and accessible workspace pages are controlled by their assigned roles, permissions, and unit leadership.

Keep new authenticated product pages in `(workspace)` unless they are exclusively for the super-admin login flow.
