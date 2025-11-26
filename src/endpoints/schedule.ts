import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.get("/schedule", async (req, res) => {
    // view schedule as a trainer
    });

    app.post("/schedule/availability", async (req, res) => {
    // sumbit your availability as a trainer
    });
}