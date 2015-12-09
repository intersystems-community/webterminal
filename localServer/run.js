var express = require("express"),
    app = express();

app.use(express.static(__dirname + "/../webSource"));

app.listen(80);
console.log("Server listens on port 80.");