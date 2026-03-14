# dts-backend

This repository contains the backend nodejs service for HMCTS DTS Case worker platform.

## This package should be accompanied with the frontend package.

Whole Package

- https://github.com/AxiosUK/hmcts-dts-demo

Frontend

- https://github.com/AxiosUK/dts-frontend

Backend Package

- CURRENT

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

## Docker Compose

The following mongodb version was used for testing due to my old server CPU not supporting AVX.

```yaml
image: mongo:4.4
environment:
  - MONGO_INITDB_ROOT_USERNAME=axios
  - MONGO_INITDB_ROOT_PASSWORD=AxiosDemo
```

### For newer CPUs

```yaml
services:
  mongodb:
    image: mongodb/mongodb-community-server:latest
    restart: unless-stopped
    ports:
      - 27017:27017
    environment:
      - MONGODB_INITDB_ROOT_USERNAME=axios
      - MONGODB_INITDB_ROOT_PASSWORD=AxiosDemo
    volumes:
      - mongodb_data:/data/db

  axios-dts-backend:
    image: ghcr.io/axiosuk/dts-backend:latest
    restart: unless-stopped
    depends_on:
      - mongodb
    ports:
      - "5180:5180"
    environment:
      - NODE_ENV=production
      - DATABASE=mongodb://mongodb:27017/axios-dts-backend?authSource=admin
      - DATABASE_USERNAME=axios
      - DATABASE_PASSWORD=AxiosDemo
      - ALLOWED_HOSTS=http://localhost:5173
      - TRUST_PROXY=true
      - RATE_LIMIT_MAX=200

volumes:
  mongodb_data:
```

## Unit testing

This project includes unit and endpoint tests using `jest` and `supertest`.

- Test files live under the `tests/` directory.
- Run tests locally:

```bash
npm install
npm test
```

- On Windows, if you encounter issues with ESM you can run Jest directly:

```powershell
node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand
```

- CI: A GitHub Actions workflow `.github/workflows/ci.yml` runs the test suite on every push and pull request.
