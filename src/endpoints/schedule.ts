import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.get("/schedule", async (_req, _res) => {
    // view schedule as a trainer
    });

    app.post("/schedule/availability", async (_req, _res) => {
    // sumbit your availability as a trainer
    });
}
