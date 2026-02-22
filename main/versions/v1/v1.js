import express from "express";
const v1Router = express.Router({ mergeParams: true });

import tasksRouter from "./routes/tasks.js";

// Base route for version 1

v1Router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    version: "v1",
    data: {
      message: "Welcome to the DTS Backend API!",
    },
  });
});

v1Router.use("/tasks", tasksRouter);

export default v1Router;
