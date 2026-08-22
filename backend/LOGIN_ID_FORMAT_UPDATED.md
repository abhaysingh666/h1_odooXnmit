# Login ID Format

## Format

```
CC NNNN YYYY SSSS      →  14 characters
```

| Part | Length | Meaning | Rule |
|------|--------|---------|------|
| `CC` | 2 | Company code | Initial of each of the first two words of the company name |
| `NNNN` | 4 | Employee code | First 2 letters of first name + first 2 letters of last name |
| `YYYY` | 4 | Year of joining | From `date_of_joining` (defaults to today) |
| `SSSS` | 4 | Joining serial | Atomic counter, scoped to company + joining year |

## Worked example

```
Company:  Odoo India
Employee: Infamous Wolverine
Joined:   2022, first employee of that year

┌──────┬──────┬──────┬──────┐
│  OI  │ INWO │ 2022 │ 0001 │
└──────┴──────┴──────┴──────┘
   │      │      │      └─ first employee of 2022
   │      │      └──────── year of joining
   │      └─────────────── INfamous + WOlverine
   └────────────────────── Odoo India

Result: OIINWO20220001
```

## Rules and edge cases

The company code takes the **initial of each of the first two words**, not the
first two letters of the name. `"Odoo India"` is `OI`, not `OD`. Punctuation and
extra whitespace are ignored, so `"Odoo India"`, `"odoo  india"` and
`"Odoo-India"` all produce `OI`. A single-word company falls back to its first
two letters (`"Microsoft"` → `MI`), and anything still shorter is padded with
`X` (`"A"` → `AX`). Only the first two words count, so
`"Tata Consultancy Services"` is `TC`.

The employee code uses the first and last name parts only — middle names are
skipped, so `"John Michael Doe"` gives `JODO`. An employee with a single name
gets its first four letters (`"Arjun"` → `ARJU`), and parts shorter than two
letters are padded with `X` (`"A B"` → `AXBX`).

| Company | Employee | Year | Serial | Login ID |
|---------|----------|------|--------|----------|
| Odoo India | Infamous Wolverine | 2022 | 1 | `OIINWO20220001` |
| Odoo India | John Doe | 2022 | 1 | `OIJODO20220001` |
| Odoo India | Priya Sharma | 2024 | 2 | `OIPRSH20240002` |
| Odoo India | Raj Singh | 2024 | 10 | `OIRASI20240010` |
| Microsoft | Satya Nadella | 2024 | 1 | `MISANA20240001` |
| A Solutions | Li Wang | 2024 | 1 | `ASLIWA20240001` |
| Tech Corp | Arjun | 2024 | 5 | `TCARJU20240005` |
| Tata Consultancy Services | Rahul Kumar | 2024 | 42 | `TCRAKU20240042` |

## Serial numbers

Serials come from a dedicated `counters` collection, one document per company
per year, incremented with a single atomic `find_one_and_update`:

```
_id: "login_serial:odoo-india:2022"   seq: 7
```

This matters for two reasons. Two admins onboarding employees at the same
moment cannot receive the same serial, and each company gets its own
`0001..9999` sequence rather than sharing a global count.

Serials are reserved, never recycled — deleting an employee does not free their
number, because reusing it would let two people share a historical Login ID.
If a company exhausts 9999 employees in one year the API returns `409`.

Uniqueness is additionally enforced by a unique index on `users.login_id`
(and on `users.email_id`), created at application startup.

## Where this lives

| Concern | Location |
|---------|----------|
| Generation logic | `app/utils/generators.py` |
| Employee creation endpoint | `POST /api/auth/admin/create-employee` |
| Unique indexes | `app/core/database.py` → `create_indexes()` |
| Tests | `tests/test_login_id.py` |

Run `python tests/test_login_id.py` from the `backend/` directory to verify all
of the cases in the table above.
