# Anytime Help — Multi-RWA Super Admin (frontend prototype)

A frontend-only, interactive prototype. It shows how Anytime Help can manage many RWAs from one Super Admin console while each society runs its own workspace.

> **Demo only.** Nothing here makes a real payment, sends email or SMS, or enforces real authorization. All data lives in your browser's `localStorage`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run lint
```

Stack: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts and Lucide icons. State lives in a single React Context (`src/lib/store.tsx`) that saves to localStorage.

## Where things are

| Area | Routes |
|---|---|
| Public join flow | `/join`, `/join/plans`, `/join/register`, `/join/checkout`, `/join/done` |
| Super Admin | `/admin`, `/admin/rwas`, `/admin/rwas/new`, `/admin/rwas/:id`, `/admin/rwas/:id/edit`, `/admin/members`, `/admin/staff`, `/admin/complaints`, `/admin/announcements`, `/admin/banners`, `/admin/permissions`, `/admin/plans`, `/admin/notifications`, `/admin/analytics`, `/admin/activity`, `/admin/settings` |
| RWA portal | `/rwa/:id`, `…/members`, `…/staff`, `…/complaints`, `…/announcements`, `…/notifications`, `…/analytics`, `…/settings` |

Use the **Demo role** switcher in the top bar to change between Super Admin, RWA Admin, Staff Manager and Resident. Pick the active society there too. Navigation and allowed actions follow the permission matrix on **Roles & Permissions** and the society's plan features.

## Demo data

The seed contains five fictional societies with residents, staff, complaints, announcements, banners, plans, notifications and activity history:

- Green Valley (Active)
- Sunrise Heights (Active)
- Maple (Trial)
- Lotus Enclave (Suspended)
- Orchid Park (Pending join request)

All contact details are fake (`.example` domains, `+91 98000 …` numbers).

- **Reset:** Settings → *Reset Demo Data*.
- **Corrupt storage:** if the saved state is unreadable, the app loads a fresh dataset and shows a notice.

## Known limitations

- Images under ~350 KB are saved as data URLs. Larger uploads use temporary object URLs and disappear after a refresh.
- The permission matrix only controls what the UI shows. It is not security.
- Prices are illustrative. "Simulate purchase" collects no payment details.
- The activity log is a demo trail stored in localStorage, not a tamper-proof audit log.
