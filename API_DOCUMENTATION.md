**API Overview**

Base URL (local): http://localhost:5180

- **API version root**: /main/v1

**Health Endpoints**

- **GET** /healthcheck
  - Returns 200 OK with plain text "OK".
  - Example:

```bash
curl -i http://localhost:5180/healthcheck
```

- **GET** /status
  - Returns JSON status and timestamp.
  - Example:

```bash
curl -i http://localhost:5180/status
```

**Version Info**

- **GET** /main/v1/
  - Returns a simple JSON welcome payload and `version: v1`.

**Tasks Resource**

All task endpoints are mounted under `/main/v1/tasks`.

Model fields (Task):

- `title` (String, required)
- `description` (String)
- `status` (String, required) — one of: `pending`, `in progress`, `completed` (default `pending`)
- `dueDate` (Date, required)
- `createdAt` (Date)
- `modifiedAt` (Date)

Notes: `title`, `status`, and `dueDate` are required by the Mongoose schema. `status` is validated to be one of the enum values.

Supported endpoints and usage

- **GET** /main/v1/tasks
  - Description: List tasks. Supports filtering, sorting, field limiting, and pagination via query string.
  - Query parameters:
    - Filtering: Any model field may be passed directly (e.g. `status=completed`). Comparison operators supported via bracket notation: `gte`, `gt`, `lte`, `lt` (e.g. `dueDate[gte]=2026-01-01`).
    - `sort`: comma-separated fields to sort by (e.g. `sort=dueDate,-createdAt`).
    - `fields`: comma-separated list of fields to include (e.g. `fields=title,status,dueDate`).
    - `page`: page number (default 1).
    - `limit`: page size (default 100).
  - Successful response: 200 with JSON { status, results, tasks }.
  - Examples:

```bash
# Get first page of tasks (default limit)
curl -i "http://localhost:5180/main/v1/tasks"

# Filter by status and limit fields
curl -i "http://localhost:5180/main/v1/tasks?status=pending&fields=title,dueDate"

# Date comparison (tasks due after 2026-01-01), sorted by dueDate
curl -i "http://localhost:5180/main/v1/tasks?dueDate[gte]=2026-01-01&sort=dueDate"
```

- **GET** /main/v1/tasks/:id
  - Description: Get a single task by its MongoDB `_id`.
  - Successful response: 200 with JSON { status, task }.
  - Error: 404 if not found.
  - Example:

```bash
curl -i http://localhost:5180/main/v1/tasks/60a6f6a2e9a0f23d4c8b4567
```

- **POST** /main/v1/tasks
  - Description: Create a new task.
  - Required body fields (JSON): `title` (string), `dueDate` (ISO date string), `status` (one of `pending|in progress|completed` — optional since it defaults to `pending`). `description` optional.
  - Response: 201 with JSON { status, message, task }.
  - Example:

```bash
curl -i -X POST http://localhost:5180/main/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Prepare report","description":"Q1 report","dueDate":"2026-03-01T00:00:00.000Z","status":"pending"}'
```

- **PATCH** /main/v1/tasks/:id
  - Description: Update an existing task. Sends partial fields to update.
  - Body: JSON with any of the task fields to update (e.g. `title`, `status`, `dueDate`, `description`). Validators run on update (`runValidators: true`).
  - Response: 200 with JSON { status, task } (updated document).
  - Example:

```bash
curl -i -X PATCH http://localhost:5180/main/v1/tasks/60a6f6a2e9a0f23d4c8b4567 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

- **DELETE** /main/v1/tasks/:id
  - Description: Delete a task by `_id`.
  - Response: 204 No Content on success. 404 if not found.
  - Example:

```bash
curl -i -X DELETE http://localhost:5180/main/v1/tasks/60a6f6a2e9a0f23d4c8b4567
```

Security / Authentication

- The current codebase does not enforce authentication middleware on the tasks routes — reads are public and writes (create/update/delete) are routed without explicit auth checks in the tasks controller or routes. If you intend to restrict writes, add an authentication/authorization middleware (e.g. in `utils/authorize.js` or `utils/authenticate.js`) and mount it on the route declarations in [main/versions/v1/routes/tasks.js](main/versions/v1/routes/tasks.js#L1).

Implementation notes and pointers to code

- Routes: [main/versions/v1/routes/tasks.js](main/versions/v1/routes/tasks.js#L1)
- Controllers: [main/versions/v1/controllers/tasks.js](main/versions/v1/controllers/tasks.js#L1)
- Model: [main/versions/v1/models/task.js](main/versions/v1/models/task.js#L1)
- Query helpers for filtering/sorting/pagination: [utils/apiFeatures.js](utils/apiFeatures.js#L1)
- App root and middleware: [app.js](app.js#L1)
