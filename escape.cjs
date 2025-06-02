const fs = require("fs");

const raw = fs.readFileSync("credentials.json", "utf-8");
const escaped = JSON.stringify(JSON.parse(raw));
console.log(escaped);