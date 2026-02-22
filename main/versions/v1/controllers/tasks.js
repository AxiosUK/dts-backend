import Task from "../models/task.js";
import APIFeatures from "../../../../utils/apiFeatures.js";
import catchAsync from "../../../../utils/catchAsync.js";
import AppError from "../../../../utils/appError.js";

export const getTasks = catchAsync(async (req, res, next) => {
  const aggregate = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tasks = await aggregate.query;

  res.status(200).json({
    status: "success",
    results: tasks.length,
    tasks,
  });
});

export const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  res.status(200).json({
    status: "success",
    task,
  });
});

export const createTask = catchAsync(async (req, res, next) => {
  const task = await Task.create(req.body);
  res.status(201).json({
    status: "success",
    message: "A new task has been created!",
    task,
  });
});

export const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  res.status(200).json({
    status: "success",
    task,
  });
});

export const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return next(new AppError("Task not found", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
