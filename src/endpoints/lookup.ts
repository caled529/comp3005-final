import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.get("/lookup", async (_req, _res) => {
    // trainer searching for members signed up for the gym. full name needed
    // utilizing prisma views for this
    });
}
