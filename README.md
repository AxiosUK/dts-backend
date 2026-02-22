# dts-backend

This repository contains the backend nodejs service for HMCTS DTS Case worker platform.

## API Summary

This service exposes a small REST API under the versioned path `/main/v1`.

- Health endpoints:

  - `GET /healthcheck` — returns plain `OK`.
  - `GET /status` — returns JSON status and timestamp.

- Tasks resource (mounted at `/main/v1/tasks`):
  - `GET /main/v1/tasks` — list tasks with filtering, sorting, field selection and pagination.
  - `GET /main/v1/tasks/:id` — get a task by id.
  - `POST /main/v1/tasks` — create a new task.
  - `PATCH /main/v1/tasks/:id` — update a task.
  - `DELETE /main/v1/tasks/:id` — delete a task.

See the full API documentation and request/response schemas in [API documentation](API_DOCUMENTATION.md).
