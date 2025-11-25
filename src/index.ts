import { PrismaClient } from "@prisma/client";
import express from "express";
import * as login from "./endpoints/login.js";
import * as registration from "./endpoints/registration.js";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.set('view engine', 'pug');
app.use(express.static("public"));

// endpoint setup
registration.setup(app, prisma);
login.setup(app, prisma);

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
  console.log(`Awesome Gym server listening on port ${port}`);
});
