import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.get("/lookup", async (req, res) => {
    // trainer searching for members signed up for the gym. full name needed
    // utilizing prisma views for this
    });
}