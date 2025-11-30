import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import { authenticate } from "../auth.js";
import z from "zod";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.get("/billing", authenticate(_prisma, "admin"), async (_req, res) => {
    // psuedo member view, lists of all the names.
    // when one is selected, uses that member_id in req for pt and group sessions
    try {
        const members = await _prisma.member.findMany({
            include: {
                user: true
            }
        });
        res.json({ success: true, members });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
    });

    app.get("/billing/pt", authenticate(_prisma, "admin"), async (req, res) => {
    // finding instances of the selected member_id, add them up through backend
    const memberId = Number(req.query.memberId);

    if (!memberId){
        return res.status(400).json({ success: false, error: "Missing memberId." })
    }

    try {
        const sessions = await _prisma.personalSession.findMany({
            where: { memberId },
            include: {
                trainer: {
                    include: { user: true }
                },
                room: true
            }
        });

        // add price and formatting!
        const items = sessions.map(s => ({
            id: s.id,
            description: `PT Session with ${s.trainer.user.name}`,
            date: s.startTime,
            price: 40,
        }));

        return res.json({ success: true, items });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });

    app.get("/billing/group", async (req, res) => {
    // finding instances of the selected member_id, add them up through backend 
    const memberId = Number(req.query.memberId);

    if (!memberId){
        return res.status(400).json({ success: false, error: "Missing memberId." });
    }

    try {
        const registrations = await _prisma.classRegistration.findMany({
            where: { memberId, attended: true },
            include: { 
                class: {
                    include: {
                        type: true,
                        trainer: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        const items = registrations.map(r => ({
            id: r.classId,
            description: `${r.class.type.name} class with ${r.class.trainer.user.name}`,
            date: r.class.startTime,
            price: 15
        }));

        return res.json({ success: true, items });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });

    // items from above two get methods can be selected
    // in which case they populate the invoice line items

    app.post("/billing/invoice", async (req, res) => {
    // live action submission of line items
    const Invoice = z.object({
        memberId: z.number(),
        lineItems: z.array(z.object({
            description: z.string(),
            price: z.number(),
            date: z.string()
        }))
    });

    const parsed = Invoice.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ success: false, errors: parsed.error.flatten() });
    }

    // instead of storing, just confirm that invoice was created.
    return res.json({
        success: true,
        message: "Invoice created",
        total: parsed.data.lineItems.reduce((sum, item) => sum + item.price, 0)
    });
    });
}
