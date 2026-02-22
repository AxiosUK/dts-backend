import mongoose from "mongoose";

process.on("uncaughtException", (err) => {
  console.log();
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(`${err.name}:`, err.message);
  process.exit(1);
});

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

import app from "./app.js";

app.listen(5180, () => {
  console.log("API listening on port 5180");
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(`${err.name}:`, err.message);
  server.close(() => {
    process.exit(1);
  });
});
