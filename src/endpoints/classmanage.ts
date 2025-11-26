import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.post("/classmanage/new", async (req, res) => {
    // making a new class type (hot yoga, pilates, etc)
    });

    app.get("/classmanage/pt", async (req, res) => {
    // displaying pt sessions that require room assignment
    });

    // STEP 1
    app.get("/classmanage/group/time", async (req, res) => {
        // choose a time for the new group class.
    });

    // STEP 2
    app.get("/classmanage/group/trainer", async (req, res) => {
    // choose a trainer for the new group class, contingent on time selected.
    });

    // STEP 3
    app.get("/classmanage/group/room", async (req, res) => {
        // choose a room for the new group class, contingent on time and trianer selected.
    });

    app.post("/classmanage", async (req, res) => {
    // saving all the changes for pt sessions and group sessions.
    // group save for both, since they're on one page.
    });
}