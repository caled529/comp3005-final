// one GET request from database
// this file is responsible for getting stuff and showing it!
import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.get("/dashboard/stats", async (_req, _res) => {
    // get the current user's stats
    });

    app.get("/dashboard/goals", async (_req, _res) => {
    // get the current user's active goals
    });

    app.get("/dashboard/past", async (_req, _res) => {
    // get the current user's past class count
    });

    app.get("/dashboard/upcoming", async (_req, _res) => {
    // get the current user's upcoming sessions
    });
}
