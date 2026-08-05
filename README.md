# SkillUp Daily

A mobile/web app that suggests daily skills and hobbies, lets users swipe them into a to-do list, and coaches progress through practice stages. Based on the included requirement document (`Requirement Document for SkillUp Daily.pdf`).

## Project structure

```
SkillUp Daily/
├── render.yaml          # Render blueprint (Postgres + Django web service)
├── skillup_backend/     # Django REST API (token auth, skill generation, coach)
│   ├── backend/         # Django project settings and URLs
│   ├── skill_app/       # App: signup, login, skill, coach, improve
│   ├── manage.py
│   ├── .env.example
│   └── requirements.txt
└── skillup_frontend/    # Expo (React Native) app with expo-router
    ├── app/             # Screens: auth (login/signup) and index (home)
    ├── components/      # SkillDeck, TodoDashboard, CoachModal
    ├── context/         # Shared auth state (token storage)
    └── constants/Api.ts # Backend API base URL
```

## Backend setup (Django, port 8001)

```bash
cd skillup_backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 0.0.0.0:8001
```

Binding to `0.0.0.0` lets phones/emulators on your LAN reach the API. In `DEBUG` mode, `ALLOWED_HOSTS` is permissive (`*`).

### Optional Anthropic AI

Copy `.env.example` to `.env` and set a key:

```bash
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY=...
```

Without a key, skill suggestions, coaching, and “Improve” use built-in fallbacks so the app works out of the box.

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/signup` | Register (`username`, `email`, `password`), returns a token |
| POST | `/api/login` | Log in (`username`, `password`), returns a token |
| GET | `/api/skill?age_group=kids\|teens\|adults&count=1..10` | Skill suggestion(s) (requires `Authorization: Token <token>`) |
| POST | `/api/coach` | Coach chat (`skill`, `stage`, `messages`) |
| POST | `/api/improve` | Sharpen a skill description (`skill`) |

### Deploy backend on Render

1. Push this repo to GitHub.
2. In [Render](https://render.com), **New → Blueprint** and select the repo (`render.yaml` at the root).
3. Set `ANTHROPIC_API_KEY` in the service env vars if you want live AI (optional).
4. Optionally set `CORS_ALLOWED_ORIGINS` to your published Expo web URL (comma-separated). If unset, all origins are allowed (API is token-authenticated).
5. After deploy, copy the service URL (e.g. `https://skillup-backend.onrender.com`) for the frontend `EXPO_PUBLIC_API_URL`.

## Frontend setup (Expo, port 8081)

Requires a recent Node.js LTS. The app targets **Expo SDK 57**.

```bash
cd skillup_frontend
npm install
npx expo start --web
```

Open http://localhost:8081.

### API URL resolution

`skillup_frontend/constants/Api.ts`:

1. `EXPO_PUBLIC_API_URL` if set (use this for published builds / Render), e.g. `https://your-service.onrender.com/api`
2. Otherwise auto-detects:
   - **Web:** `http://127.0.0.1:8001/api`
   - **Native device:** LAN IP from Expo constants
   - **Android emulator:** `10.0.2.2` when host is localhost

### Home screen features

- Swipe deck of skills (right = add, left = skip) plus clickable Add/Skip buttons for web
- Right sidebar dashboard: active vs completed counts, To-Do (stage + Coach / Improve), collapsible Completed
- To-do list persists in AsyncStorage
- Coach modal → `POST /api/coach`
- Improve action → `POST /api/improve` (rewrites the skill description)

### Publish with Expo (EAS Update) — no store binaries

This project is meant to be published via your Expo account (OTA update), not as App Store / Play Store binaries.

1. Log in (interactive — do this yourself; do not share credentials with agents):

```bash
cd skillup_frontend
npx eas-cli login
npx eas-cli whoami
```

2. Configure the project once (creates/links an EAS project):

```bash
npx eas-cli init
```

3. Publish an update, pointing at your Render backend:

```bash
EXPO_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api npx eas-cli update --branch production --message "SkillUp Daily"
```

For a quick Expo Go QR experience during development, `npx expo start` is enough; use EAS Update when you want a shareable published build without store submission.

## Local demo accounts

If the local SQLite DB already has it: `testuser1` / `S3curePass!`. Otherwise sign up from the auth screen.
