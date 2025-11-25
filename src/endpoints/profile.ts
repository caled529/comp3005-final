// added "DOM" to lib in tsconfig.json, else document isn't identified
let save = document.getElementById("submit");
if (save !== null) {
    save.onclick = submitProfileDetails;
}
async function submitProfileDetails() {

}