// // added "DOM" to lib in tsconfig.json, else document isn't identified
// let save = document.getElementById("submit");
// if (save !== null) {
//     save.onclick = submitProfileDetails;
// }
// // function to update the profile
// async function submitProfileDetails() {

// }

// put 
// this file is responsible for getting stuff and showing it!
import { PrismaClient } from "@prisma/client";
import { type Express } from "express";

export const setup = (app: Express, _prisma: PrismaClient) => {
    app.put("/profile/details", async (_req, _res) => {
    // update the current user's profile details
    });

    app.post("/profile/goals", async (_req, _res) => {
    // add a new fitness goal
    });

    app.post("/profile/metrics", async (_req, _res) => {
    // add a new health metric
    });
}
