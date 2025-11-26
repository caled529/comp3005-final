// added "DOM" to lib in tsconfig.json, else document isn't identified
let save = document.getElementById("submit");
if (save) {
  save.onclick = () => {
    // TODO: implement submitProfileDetails function
    console.log("Profile submit clicked");
  };
}
