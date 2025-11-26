import { PrismaClient } from "@prisma/client";
import express from "express";
import * as login from "./endpoints/login.js";
import * as registration from "./endpoints/registration.js";
import path from "path";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// Frontend endpoint
app.use("/app", express.static(path.join(import.meta.dirname, "../client/")));
app.get("/", (_, res) => res.redirect("/app"));

// API endpoints
registration.setup(app, prisma);
login.setup(app, prisma);

const host = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "8080");
app.listen(port, host, (err) => {
  if (err === undefined) {
    console.log(`Awesome Gym API server listening on ${host}:${port}`);
  } else {
    console.error(err);
  }
});
