import mongoose from "mongoose";

process.on("uncaughtException", (err) => {
  console.log();
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(`${err.name}:`, err.message);
  process.exit(1);
});

// Build mongoose connection options. If a DB username/password are provided
// prefer using those as authentication credentials rather than embedding
// credentials in the `DATABASE` URI.
const dbUri = process.env.DATABASE;
const mongooseOptions = {};
if (process.env.DATABASE_USERNAME && process.env.DATABASE_PASSWORD) {
  mongooseOptions.auth = {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  };
}

mongoose
  .connect(dbUri, mongooseOptions)
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

import app from "./app.js";

// Keep the server reference so we can gracefully shut down on unhandled rejections
const server = app.listen(5180, () => {
  console.log("API listening on port 5180");
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(`${err.name}:`, err.message);
  server.close(() => {
    process.exit(1);
  });
});
