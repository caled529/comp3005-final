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
import z from "zod";

export const setup = (app: Express, prisma: PrismaClient) => {
    app.put("/profile/details", async (req, res) => {
    // update the current user's profile details
    });

    app.post("/profile/goals", async (req, res) => {
    // add a new fitness goal
    });

    app.post("/profile/metrics", async (req, res) => {
    // add a new health metric
    });
}