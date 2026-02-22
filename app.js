import express from "express";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

import AppError from "./utils/appError.js";
import v1Router from "./main/versions/v1/v1.js";
import errorController from "./utils/errorController.js";

const app = express();

app.set(
  "trust proxy",
  process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true" ? 1 : 0,
);

const allowedOrigins = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// Global Middlewares
// Protect against HTTP Parameter Pollution early: collapse duplicate query params
// before other middleware inspects or mutates `req.query`.
app.use(hpp());
app.use(helmet());

// Normalize common query params that may arrive as arrays (e.g. ?sort=a&sort=b)
// - For `sort` and `fields` we join multiple values with comma to preserve ordering
// - For numeric params like `page` and `limit` we take the first value
app.use((req, res, next) => {
  try {
    const q = req.query || {};
    if (Array.isArray(q.sort)) q.sort = q.sort.join(",");
    if (Array.isArray(q.fields)) q.fields = q.fields.join(",");
    if (Array.isArray(q.page)) q.page = q.page[0];
    if (Array.isArray(q.limit)) q.limit = q.limit[0];
  } catch (e) {
    console.warn(
      "Warning: failed to normalize query params:",
      e && e.message ? e.message : e,
    );
  }
  next();
});

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

const limiter = rateLimit({
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 200,
  windowMs: 30 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 30mins!",
});

app.use("/main/v1", limiter);

app.use(express.json({ limit: "10mb" }));

// Use express-mongo-sanitize's `sanitize` function to mutate request objects in-place
// instead of using the default middleware which replaces `req.body/params/headers/query`.
// Replacing the property can throw in some environments where these are getter-only.
app.use((req, res, next) => {
  try {
    const sanitizer =
      mongoSanitize && mongoSanitize.sanitize ? mongoSanitize.sanitize : null;
    if (sanitizer) {
      ["body", "params", "headers", "query"].forEach((key) => {
        if (req[key]) {
          try {
            sanitizer(req[key]);
          } catch (e) {
            // Log and continue; do not crash the request because sanitization failed for one object
            console.warn(
              `Warning: failed to sanitize req.${key}:`,
              e && e.message ? e.message : e,
            );
          }
        }
      });
    }
  } catch (err) {
    console.warn(
      "Warning: mongoSanitize middleware replacement failed:",
      err && err.message ? err.message : err,
    );
  }
  next();
});

// XSS protection: sanitize string values in-place (do NOT reassign req.query or other
// request properties which may be getter-only in some environments). This recursively
// strips HTML tags from any string value in the target objects.
const isPlainObject = (v) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function sanitizeString(str) {
  // basic tag stripper — removes anything between angle brackets.
  // This is intentionally simple and is intended as an additional layer of defense
  // alongside server-side validation. For production consider a robust library.
  return String(str)
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:\s*/gi, "");
}

function sanitizeRecursive(value) {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = sanitizeRecursive(value[i]);
    }
    return value;
  }
  if (isPlainObject(value)) {
    Object.keys(value).forEach((k) => {
      try {
        value[k] = sanitizeRecursive(value[k]);
      } catch (e) {
        // keep going on errors for robustness
        console.warn(
          `Warning: failed to sanitize nested key ${k}:`,
          e && e.message ? e.message : e,
        );
      }
    });
    return value;
  }
  return value;
}

app.use((req, res, next) => {
  try {
    ["body", "params", "headers", "query"].forEach((key) => {
      if (req[key]) {
        try {
          sanitizeRecursive(req[key]);
        } catch (e) {
          console.warn(
            `Warning: failed to sanitize req.${key}:`,
            e && e.message ? e.message : e,
          );
        }
      }
    });
  } catch (err) {
    console.warn(
      "Warning: XSS sanitization middleware failed:",
      err && err.message ? err.message : err,
    );
  }
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/main/v1", v1Router);

app.use("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});
app.use("/status", (req, res) => {
  res.status(200).json({
    status: "success",
    timestamp: new Date().toISOString(),
  });
});

// Handle Route Errors (catch-all for unmatched routes)
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorController);

export default app;
