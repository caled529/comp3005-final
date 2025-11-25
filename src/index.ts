import { PrismaClient } from "@prisma/client";
import express from "express";
import * as registration from "./endpoints/registration.js";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// endpoint setup
registration.setup(app, prisma);

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
  console.log(`Awesome Gym server listening on port ${port}`);
});
