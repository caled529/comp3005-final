import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.gymUser.createMany({
	data: [
		{ email: "cale@awesome.gym", name: "Cale" },
		{ email: "ramona@awesome.gym", name: "Ramona" },
		{ email: "tomi@awesome.gym", name: "Tomi" },
	],
	skipDuplicates: true,
});

prisma.gymUser.findMany().then(users => {
	for (const user of users) {
		console.log(`${user.name}'s email is ${user.email}`);
	}
});
