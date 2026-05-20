# ITFlow

ITFlow is a web application for managing teams, employees and tasks. It includes a Laravel backend API and a React + Vite frontend. This README explains how to run the project locally for development.

Table of contents
- Prerequisites
- Backend (API) setup
- Frontend (web UI) setup
- Common troubleshooting

Prerequisites

Make sure you have the following installed on your machine:

- PHP 8.3+
- Composer
- Node.js (18+) and npm or pnpm
- A database (MySQL, MariaDB, or PostgreSQL) and an accessible database user
- (Optional) Redis for queues/broadcasting

Clone the repository and open a terminal in the project root:

```bash
git clone https://github.com/oualidamranihassani160-prog/ITFlow.git
cd itflow
```

Backend (Laravel API)
---------------------

1. Install PHP dependencies

```bash
cd backend
composer install
```

2. Environment

Copy the example env and edit DB credentials and other environment values in `backend/.env` (DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD, APP_URL, MAIL_* if used).

```bash
cp .env.example .env
# edit .env and set DB credentials
```

3. Generate application key

```bash
php artisan key:generate
```

4. (Optional) If your composer.json does not already contain the Hashids package, install it

```bash
composer require vinkla/hashids
```

Note: this project already lists `vinkla/hashids` in `backend/composer.json`, so the package should be installed by `composer install`.

5. Run migrations and seeders

You can run migrations and seeds on a fresh database. WARNING: `migrate:fresh` will drop all data.

```bash
# fresh start (remove & recreate tables) and seed
php artisan migrate:fresh --seed

# or run migrations then seed
php artisan migrate
php artisan db:seed
```

6. (Optional) There is a composer project script named `setup` that runs a typical setup (migrate + npm build). You can run it as:

```bash
composer run setup
```

7. Serve the backend (development)

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

This starts the API at `http://127.0.0.1:8000` by default.

Frontend (React + Vite)
-----------------------

Open a new terminal and go to the frontend folder.

```bash
cd ../frontend
```

1. Install dependencies

The project already lists the required dependencies in `frontend/package.json`. The simplest option is:

```bash
npm install
```

If you want to explicitly install the packages you mentioned, you can run (not necessary if `package.json` already contains them):

```bash
# dependencies
npm install react react-dom react-router-dom @reduxjs/toolkit react-redux axios lucide-react react-hot-toast framer-motion @hello-pangea/dnd

# dev dependencies
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite autoprefixer
```

2. Start the dev server

```bash
npm run dev
```

This runs Vite's dev server (default `http://localhost:5173`) and hot reloads the frontend.

Connecting frontend to backend
------------------------------

By default the frontend expects the API to be available at the backend host configured in its environment or `src/api` configuration. Update the frontend config or use a `.env` for Vite if necessary (for example `VITE_API_URL=http://127.0.0.1:8000/api`).

Other helpful commands
-----------------------

- Run background workers (local dev):

```bash
php artisan queue:work
```

- Create storage symlink for public files (avatars, uploads):

```bash
php artisan storage:link
```

Tips & Troubleshooting
----------------------

- Ensure `APP_KEY` is set in `.env` before seeding messages (messages bodies are encrypted). If you get encryption errors, re-run `php artisan key:generate`.
- If seeded users can't login, check DB migrations and that `users` table has the expected columns (`role`, `created_by`, `manager_id`).
- If you changed schema after seeding, run `php artisan migrate:fresh --seed` to reset.

Advanced / Optional
-------------------

- Create a large test dataset (the seeder now generates many users/tasks/messages). Running the seeder on a fresh DB will create ~1 admin, 7 managers, ~50 employees, 136 tasks and several messages for testing.
- If you prefer a separate opt-in large seeder, I can extract the current logic to a dedicated `LargeTestSeeder` and keep `DatabaseSeeder` minimal.

License
-------

MIT

If you'd like, I can also add a short `backend/README.md` and `frontend/README.md` with their own rapid-start instructions and environment examples.
