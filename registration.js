const z = require("zod");
const { pool } = require("./dbConnect");

const setup = (app) => {
	const UniqueEmail = z.email().refine(
		async (email) => {
			const result = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
			return result.rows.length === 0;
		},
		{ error: "Invalid input: email already in use" },
	);

	app.post("/register", async (req, res) => {
		const Registration = z.object({
			email: UniqueEmail,
			password: z.string(),
			name: z.string(),
			phone: z.string().regex(/^\d{10}$/), // validates phone numbers (10 digit number strings)
			birthdate: z.coerce.date(),
			gender: z.enum(["male", "female", "other"]),
		});
		const result = await Registration.safeParseAsync(req.body);
		if (!result.success) {
			res.status(400).json(z.flattenError(result.error));
			return;
		}
		try {
			const conn = await pool.connect();
			try {
				await conn.query('BEGIN');
				const userResult = await conn.query(
					'INSERT INTO "User" (email, password, name) VALUES ($1, $2, $3) RETURNING id',
					[result.data.email, result.data.password, result.data.name]
				);
				await conn.query(
					'INSERT INTO "Member" ("userId", birthdate, gender, phone) VALUES ($1, $2, $3, $4)',
					[userResult.rows[0].id, result.data.birthdate, result.data.gender, result.data.phone]
				);
				await conn.query('COMMIT');
			} catch (error) {
				await conn.query('ROLLBACK');
				throw error;
			} finally {
				conn.release();
			}
			res.status(201).redirect("/login");
		} catch (error) {
			console.error(`${new Date().toString()} | ERROR: ${error}`);
			res.sendStatus(500);
		}
	});
};

module.exports = { setup };
