import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.get("/billing", async (req, res) => {
    // psuedo member view, lists of all the names.
    // when one is selected, uses that member_id in req for pt and group sessions
    });

    app.get("/billing/pt", async (req, res) => {
    // finding instances of the selected member_id, add them up through backend
    });

    app.get("/billing/group", async (req, res) => {
    // finding instances of the selected member_id, add them up through backend 
    });

    // items from above two get methods can be selected
    // in which case they populate the invoice line items

    app.post("/billing/invoice", async (req, res) => {
    // live action submission of line items
    });
}