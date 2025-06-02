const fs = require("fs");

const cred = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
console.log(JSON.stringify(cred));
