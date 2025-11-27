import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.post("/classmanage/new", async (_req, _res) => {
    // making a new class type (hot yoga, pilates, etc)
    });

    app.get("/classmanage/pt", async (_req, _res) => {
    // displaying pt sessions that require room assignment
    });

    // STEP 1
    app.get("/classmanage/group/time", async (_req, _res) => {
        // choose a time for the new group class.
    });

    // STEP 2
    app.get("/classmanage/group/trainer", async (_req, _res) => {
    // choose a trainer for the new group class, contingent on time selected.
    });

    // STEP 3
    app.get("/classmanage/group/room", async (_req, _res) => {
        // choose a room for the new group class, contingent on time and trianer selected.
    });

    app.post("/classmanage", async (_req, _res) => {
    // saving all the changes for pt sessions and group sessions.
    // group save for both, since they're on one page.
    });
}
