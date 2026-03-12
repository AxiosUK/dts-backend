import { jest } from "@jest/globals";
import request from "supertest";

let app;

import AppError from "../utils/appError.js";

beforeAll(async () => {
  // Mock the controllers module so routes use in-memory handlers (no DB)
  const tasksData = [
    {
      _id: "1",
      title: "Task A",
      status: "pending",
      dueDate: "2026-03-01T00:00:00.000Z",
    },
    {
      _id: "2",
      title: "Task B",
      status: "completed",
      dueDate: "2026-02-01T00:00:00.000Z",
    },
  ];

  const mockControllers = {
    getTasks: async (req, res) => {
      res
        .status(200)
        .json({
          status: "success",
          results: tasksData.length,
          tasks: tasksData,
        });
    },
    getTask: async (req, res, next) => {
      const t = tasksData.find((x) => x._id === req.params.id);
      if (!t) return next(new AppError("Task not found", 404));
      res.status(200).json({ status: "success", task: t });
    },
    createTask: async (req, res) => {
      const newTask = { ...req.body, _id: "newid" };
      tasksData.push(newTask);
      res
        .status(201)
        .json({
          status: "success",
          message: "A new task has been created!",
          task: newTask,
        });
    },
    updateTask: async (req, res, next) => {
      const idx = tasksData.findIndex((x) => x._id === req.params.id);
      if (idx === -1) return next(new AppError("Task not found", 404));
      tasksData[idx] = { ...tasksData[idx], ...req.body };
      res.status(200).json({ status: "success", task: tasksData[idx] });
    },
    deleteTask: async (req, res, next) => {
      const idx = tasksData.findIndex((x) => x._id === req.params.id);
      if (idx === -1) return next(new AppError("Task not found", 404));
      tasksData.splice(idx, 1);
      res.status(204).json({ status: "success", data: null });
    },
  };

  await jest.unstable_mockModule(
    "../main/versions/v1/controllers/tasks.js",
    () => mockControllers,
  );
  const mod = await import("../app.js");
  app = mod.default;
});

describe("Health and version endpoints", () => {
  test("GET /healthcheck returns OK", async () => {
    const res = await request(app).get("/healthcheck");
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });

  test("GET /status returns JSON status", async () => {
    const res = await request(app).get("/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "success");
    expect(res.body).toHaveProperty("timestamp");
  });

  test("GET /main/v1/ returns version payload", async () => {
    const res = await request(app).get("/main/v1/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("version", "v1");
  });
});

describe("Tasks endpoints (mocked Task model)", () => {
  test("GET /main/v1/tasks returns an array of tasks", async () => {
    const res = await request(app).get("/main/v1/tasks");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.results).toBe(res.body.tasks.length);
  });

  test("GET /main/v1/tasks/:id returns task when found", async () => {
    const res = await request(app).get("/main/v1/tasks/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("task");
    expect(res.body.task).toHaveProperty("_id", "1");
  });

  test("GET /main/v1/tasks/:id returns 404 when not found", async () => {
    const res = await request(app).get("/main/v1/tasks/notfound");
    expect(res.status).toBe(404);
  });

  test("POST /main/v1/tasks creates a task", async () => {
    const payload = { title: "New T", dueDate: "2026-04-01T00:00:00.000Z" };
    const res = await request(app)
      .post("/main/v1/tasks")
      .send(payload)
      .set("Content-Type", "application/json");
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("task");
    expect(res.body.task).toHaveProperty("_id", "newid");
  });

  test("PATCH /main/v1/tasks/:id updates a task", async () => {
    const res = await request(app)
      .patch("/main/v1/tasks/1")
      .send({ status: "completed" })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(200);
    expect(res.body.task).toHaveProperty("status", "completed");
  });

  test("DELETE /main/v1/tasks/:id deletes a task", async () => {
    const res = await request(app).delete("/main/v1/tasks/1");
    expect(res.status).toBe(204);
  });

  test("DELETE /main/v1/tasks/:id returns 404 when not found", async () => {
    const res = await request(app).delete("/main/v1/tasks/notfound");
    expect(res.status).toBe(404);
  });
});
