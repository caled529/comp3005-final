import { $Enums, PrismaClient } from "@prisma/client";
import express from "express";

export const authenticate = (
	prisma: PrismaClient,
	role: $Enums.Role = "member",
) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
	const failure = (): any => {
		res.setHeader("WWW-Authenticate", 'Basic realm="Gym System"');
		let err: any = new Error("Not authenticated");
		err.status = 401;
		return err;
	};
	const authHeader = req.headers.authorization;
	if (authHeader === undefined) {
		return next(failure());
	}
	const encodedCredentials = authHeader.split(' ')[1];
	if (encodedCredentials === undefined) {
		return next(failure());
	}
	const [email, _] = Buffer.from(encodedCredentials, "base64").toString().split(":");
	if (email === undefined) {
		return next(failure());
	}
	try {
		const user = await prisma.user.findUnique({ where: { email } });
		if (user === null) {
			return next(failure());
		}
		if (user.role !== role) {
			return next({ status: 403 });
		}
		next();
	} catch (error) {
		console.error(`${new Date().toString()} | ERROR: ${error}`);
		return next({ status: 500 });
	}
};
