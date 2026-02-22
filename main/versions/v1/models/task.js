import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A task must have a title"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "in progress", "completed"],
    default: "pending",
  },
  dueDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
