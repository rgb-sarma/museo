# Museo

Museum discovery + ticketing app. Find museums in your city, browse exhibitions,
book timed entry with mock payment, carry a QR ticket, and leave star ratings.

Built from the `Museo.dc.html` Claude Design prototype in `bachelor-s-project-design/`.

- **Frontend** — Ionic 8 + Vue 3 + Capacitor (Android target), Pinia, Vue Router, axios, `qrcode`
- **Backend** — FastAPI + SQLModel + SQLite, JWT auth via `python-jose`, bcrypt password hashing

## Running it

Two processes. Backend first, so the app always has something to talk to.

**Backend** (from `backend/`):

```bash
cd backend && .venv/bin/python -m app.seed && .venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Swagger UI at http://localhost:8000/docs.

**Frontend** (from `app/`):

```bash
cd app && npm run dev
```

Opens on http://localhost:5173. Demo login is prefilled: `maja@example.com` / `museodemo`.

### On an Android device or emulator

The webview has its own `localhost`, so point the app at your machine's LAN IP:

```bash
cp app/.env.example app/.env.local   # then edit VITE_API_URL to your IP
```

and bind uvicorn to all interfaces with `--host 0.0.0.0`.

## Layout

```
backend/app/
  main.py          FastAPI app, CORS, router wiring
  database.py      SQLite engine + session dependency
  models.py        users, museums, exibitions, bookings, reviews
  schemas.py       request/response shapes
  auth.py          password hashing, JWT, get_current_user
  seed.py          demo data — 16 museums across 3 cities
  routers/         auth.py, museums.py, bookings.py

app/src/
  api/             axios client, typed endpoint wrappers
  stores/          Pinia: auth, museums, bookings
  views/           the 12 screens from the design
  components/      MuseumCard, MuseumRow, MuseumImage, StateBlock
  utils/           formatting, distance, ICS calendar export
  theme/           design tokens from the prototype
```

## API

| Method | Path | Auth | Purpose |
|---|---|:-:|---|
| POST | `/auth/register` | | Create account, return JWT |
| POST | `/auth/login` | | Return JWT |
| GET | `/auth/me` | ● | Current user |
| GET | `/museums` | | List; `city`, `category`, `min_rating`, `q`, `sort` |
| GET | `/museums/{id}` | | Detail with exhibitions + aggregated rating |
| GET | `/museums/{id}/reviews` | | Reviews for a museum |
| POST | `/museums/{id}/reviews` | ● | Add or update your review |
| GET | `/reviews/me` | ● | Your reviews (Profile screen) |
| GET | `/categories` | | Category list for filters |
| GET | `/bookings/slots` | | Available time slots |
| POST | `/bookings` | ● | Create a booking |
| GET | `/bookings` | ● | Your bookings; `when=upcoming\|past` |
| GET | `/bookings/{id}` | ● | Single booking, for the ticket |
| PATCH | `/bookings/{id}/cancel` | ● | Cancel an upcoming booking |

## Demo scope

Mocked by design, per the project spec: payments never charge, email verification
auto-passes, and every time slot is always available (no capacity tracking).

Average ratings and review counts are computed on the fly from the `reviews` table
rather than denormalised — cheap at this scale and always consistent.
