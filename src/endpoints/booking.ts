import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.put("/booking/pt", async (_req, _res) => {
    // booking a personal training session
    // 1st: choose a trainer.
    // 2nd: then needs to check the selected trainer's availability and present available times as a dropdown
    // 3rd: alert: saved success! (the pt class instance is created with the room being null)
    });

    app.put("/booking/group", async (_req, _res) => {
    // booking a group class session
    // choose a class! (easy since it already comes with the trainer + time + room)
    // backend stuff: checks for capacity and then returns a result (either success or failure)
    });
}
