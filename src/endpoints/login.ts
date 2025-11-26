import { PrismaClient } from "@prisma/client";
import { type Express } from "express";
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
  app.post("/login", async (req, res) => {
    const Credentials = z.object({
      email: z.email(),
    });
    const result = Credentials.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: z.flattenError(result.error),
      });
      return;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { email: result.data.email },
      });
      if (user === null) {
        res.json({ success: false });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error(`${new Date().toString()} | ERROR: ${error}`);
      res.status(500).json({
        success: false,
        errors: {
          server: "Failed to log in",
        },
      });
    }
  });
};
