import express from "express";
const tribesRouter = express.Router({ mergeParams: true });

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/tasks.js";

// Public reads; restrict write operations to byms admins
tribesRouter.route("/").get(getTasks).post(createTask);
tribesRouter.route("/:id").get(getTask).patch(updateTask).delete(deleteTask);

export default tribesRouter;
