// one GET request from database
// this file is responsible for getting stuff and showing it!
import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.get("/dashboard/stats", async (req, res) => {
    // get the current user's stats
    });

    app.get("/dashboard/goals", async (req, res) => {
    // get the current user's active goals
    });

    app.get("/dashboard/past", async (req, res) => {
    // get the current user's past class count
    });

    app.get("/dashboard/upcoming", async (req, res) => {
    // get the current user's upcoming sessions
    });
}