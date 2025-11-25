import { PrismaClient } from "@prisma/client";
import express from "express";

export const authenticate = (prisma: PrismaClient) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
	if (prisma.user.findUnique({ where: { email } }) === null) {
		return next(failure());
	}
	next();
};
