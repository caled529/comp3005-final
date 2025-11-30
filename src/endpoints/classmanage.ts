import { PrismaClient, Weekday } from "@prisma/client";
import { type Express } from "express";
import { authenticate } from "../auth.js";
import z from "zod";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.post("/classmanage/new", authenticate(_prisma, "admin"), async (req, res) => {
    // making a new class type (hot yoga, pilates, etc)
    
    // checking the request body to ensure it's valid.
    const schema = z.object({
        // must be a field called name + be a string with a minimum of 1 character.
        name: z.string().min(1),
    });

    // this is what was sent in the request.rather than throw an error, safeParse will report whether the validation failed or not after comparing it to the schema.
    const result = schema.safeParse(req.body);
    // if it failed, then return a 400 "bad request" error.
    if (!result.success){
        return res.status(400).json({ success: false, error: "Invalid class type name." });
    }

    try {
        // create a new class type and insert it into the prisma database.
        const type = await _prisma.classType.create({
            data: { name: result.data.name },
        });
        return res.json({ success: true, type });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });

    // displaying pt sessions that require room assignment
    app.get("/classmanage/pt", authenticate(_prisma, "admin"), async (_req, res) => {
    try {
        // look for where the room assignment is null within the database,
        const sessions = await _prisma.personalSession.findMany({
            where: { roomId: 0 }, // keeps giving me an error bc it doesn't like the null :(
            // make sure the trainer and member are there to ensure it's a real pt request.
            include: {
                trainer: { include: { user: true } },
                member: { include: { user: true } },
            },
        });
        // once successful, send back the request.
        return res.json({ success: true, sessions });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });

    // STEP 1
    app.get("/classmanage/group/time", authenticate(_prisma, "admin"), async (req, res) => {
        // choose a time for the new group class. (the admin chooses a time.)
        // takes the query sent by the frontend.
        const date = req.query.date as string;
        if (!date) return res.status(400).json({ success: false, error: "Missing date." });

        // start of the day (00:00:00)
        const dayStart = new Date(date);
        const dayEnd = new Date(date);

        // end of the day.
        dayEnd.setHours(23, 59, 59, 999);

        try {
            // fetch anything (both group and pt sessions) scheduled on that day, starting with group classes.
            const classes = await _prisma.scheduledClass.findMany({
                where: {
                    startTime: { gte: dayStart, lte: dayEnd }
                },
                include: { room: true, trainer: true }
            });

            const sessions = await _prisma.personalSession.findMany({
                where: {
                    startTime: { gte: dayStart, lte: dayEnd }
                },
                include: { room: true, trainer: true }
            });

            // sends the frontend everything it needs to draw a daily schedule grid.
            return res.json({
                success: true,
                classes,
                sessions,
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err });
        }
    });

    // STEP 2
    app.get("/classmanage/group/trainer", authenticate(_prisma, "admin"), async (req, res) => {
    // choose a trainer for the new group class, contingent on time selected.
    const { start, end, date } = req.query as any;
    if (!start || !end || !date ){
        return res.status(400).json({ success: false, error: "Missing parameters."});
    }

    const startTime = new Date(`${date}T${start}`);
    const endTime = new Date(`${date}T${end}`);

    // convert date to weekday enum
    // a fixed list of weekday names that exactly match the enum keys in prisma.
    // "as const" tells typescript that it's not a generic array and a tupel of fixed strings
    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
    // get the numeric weekday from the Date object (0=sunday, 6=saturday)
    // getDay() returns a number, but typescript was being annoying and worrying that it could've been anything.
    // so i had explicitly cast it to be a tuple.
    const weekdayIndex = new Date(date).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const weekday = Weekday[weekdayNames[weekdayIndex]];

    try {
        const trainers = await _prisma.trainer.findMany({
            where: {
                availability: {
                    some: {
                        day: weekday,
                        startTime: { lte: startTime },
                        endTime: { gte: endTime }
                    },
                },
                // no class conflict
                classes: {
                    none: {
                        OR: [
                            { startTime: { lte: endTime }, endTime: { gte: startTime } }
                        ]
                    }
                },
                // no session conflict
                sessions: {
                    none: {
                        OR: [
                            { startTime: { lte: endTime }, endTime: { gte: startTime } }
                        ]
                    }
                }
            },
            include: { user: true }
        });

        return res.json({ success: true, trainers });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });

    // STEP 3
    app.get("/classmanage/group/room", authenticate(_prisma, "admin"), async (req, res) => {
        // choose a room for the new group class, contingent on time and trainer selected.
        const { start, end, date } = req.query as any;

        if (!start || !end || !date){
            return res.status(400).json({ success: false, error: "Missing parameters."});
        }

        const startTime = new Date(`${date}T${start}`);
        const endTime = new Date(`${date}T${end}`);

        try {
            const rooms = await _prisma.room.findMany({
                where: {
                    OR: [
                        { allows: "all" },
                        { allows: "group" }
                    ],
                    // no class conflict
                    scheduledClasses: {
                        none: {
                            OR: [
                                { startTime: { lte: endTime }, endTime: { gte: startTime } }
                            ]
                        }
                    },
                    // no pt sessions
                    personalSessions: {
                        none: {
                            OR: [
                                { startTime: { lte: endTime }, endTime: { gte: startTime } }
                            ]
                        }
                    }
                }
            });
            return res.json({ success: true, rooms });
        } catch (err) {
            return res.status(500).json({ success: false, error: err });
        }
    });

    app.post("/classmanage", authenticate(_prisma, "admin"), async (req, res) => {
    // saving all the changes for pt sessions and group sessions.
    // group save for both, since they're on one page.

    const schema = z.object({
        groupClasses: z.array(z.object({
            typeId: z.number(),
            trainerId: z.number(),
            roomId: z.number(),
            startTime: z.string(),
            endTime: z.string(),
        })),
        ptSessions: z.array(z.object({
            sessionId: z.number(),
            roomId: z.number(),
        }))
    });

    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ success: false, error: "Invalid input format." });

    try {
        // bulk create classes
        await _prisma.scheduledClass.createMany({
            data: result.data.groupClasses.map(c => ({
                typeId: c.typeId,
                trainerId: c.trainerId,
                roomId: c.roomId,
                startTime: new Date(c.startTime),
                endTime: new Date(c.endTime),
            })),
        });

        // update pt sessions.
        for (const s of result.data.ptSessions) {
            await _prisma.personalSession.update({
                where: { id: s.sessionId },
                data: { roomId: s.roomId },
            });
        }

        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err });
    }
    });
}
