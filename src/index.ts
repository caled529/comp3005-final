import { PrismaClient } from "@prisma/client";
import express from "express";
import z from "zod";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

const UniqueEmail = z.email().refine(
  async (email) => {
    const match = await prisma.user.findUnique({
      where: { email: email },
    });
    return match === null;
  },
  { error: "Invalid input: email already in use" },
);

app.post("/register/checkEmail", async (req, res) => {
  const EmailCheck = z.object({
    email: UniqueEmail,
  });
  const result = await EmailCheck.safeParseAsync(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      errors: z.flattenError(result.error),
    });
    return;
  }
  res.json({ success: true });
});

app.post("/register", async (req, res) => {
  const Registration = z.object({
    email: UniqueEmail,
    name: z.string(),
    birthdate: z.coerce.date(),
    gender: z.enum(["male", "female", "other"]),
    phone: z.string().regex(/^\d{10}$/), // validates phone numbers (10 digit number strings)
  });
  const result = await Registration.safeParseAsync(req.body);
  if (!result.success) {
    res.json({
      success: false,
      errors: z.flattenError(result.error),
    });
    return;
  }
  try {
    await prisma.user.create({
      data: {
        email: result.data.email,
        name: result.data.name,
        member: {
          create: {
            birthdate: result.data.birthdate,
            gender: result.data.gender,
            phone: result.data.phone,
          },
        },
      },
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error(`${new Date().toString()} | ERROR: ${error}`);
    res.status(500).json({
      success: false,
      errors: {
        server: "Failed to register user",
      },
    });
  }
});

const port = process.env.PORT ?? 8080;
app.listen(port, () => {
  console.log(`Awesome Gym server listening on port ${port}`);
});
