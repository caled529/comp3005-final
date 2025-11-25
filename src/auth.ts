import { PrismaClient } from "@prisma/client";
import express from "express";

export enum AuthLevel {
	admin = "admin",
	member = "member",
	trainer = "trainer",
};

export const authenticate = (
	prisma: PrismaClient,
	level: AuthLevel = AuthLevel.member,
) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
	const user = prisma.user.findUnique({ where: { email } });
	if (user === null) {
		return next(failure());
	}
	switch (level) {
		case AuthLevel.admin:
			if (user.member !== undefined || user.trainer !== undefined) {
				return next({ status: 403 });
			}
			break;
		case AuthLevel.member:
			if (user.member === undefined) {
				return next({ status: 403 });
			}
			break;
		case AuthLevel.trainer:
			if (user.trainer === undefined) {
				return next({ status: 403 });
			}
			break;
	}
	next();
};
