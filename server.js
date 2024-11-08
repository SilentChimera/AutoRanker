let roblox = require("noblox.js");
let express = require("express");
let BodyParser = require("body-parser");

let config = require("./config.json");

// Modules

let Utility = require("./utility/functions.js");

let app = express();
let port = process.env.PORT || 8080;

app.set("env", "production");
app.use(BodyParser.json()); 
app.use(Utility.Authenticate); 

const { Promotions, SetRank, JoinRequests, GroupShouts, Validate } = require('./utility/validator.js')

app.get("/", (req, res) => res.status(200).send("Server is online!"));

app.post("/Promote", Promotions(), Validate, Utility.ChangeRank(1));
app.post("/Demote", Promotions(), Validate, Utility.ChangeRank(-1));
app.post("/SetRank", SetRank(), Validate, function (req, res, next) {

    let Group = req.body.Group
    let Target = req.body.Target
    let Rank = req.body.Rank

    Utility.SetRank(res, Group, Target, Rank) 
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message })
        });
});

app.post("/HandleJoinRequest", JoinRequests(), Validate, function (req, res, next) {

    let Group = req.body.Group
    let Username = req.body.Username
    let Accept = req.body.Accept

    roblox.handleJoinRequest({ group: Group, username: Username, accept: Accept })
        .then(() => {
            console.log(`Handled join request of user ${Username} successfully.`)
            res.status(200).send({
                error: null,
                message: `Handled join request of user ${Username} successfully.`
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message })
        });
});

app.post("/GroupShout", GroupShouts(), Validate, function (req, res, next) {

    let Group = req.body.Group
    let Message = req.body.Message

    roblox.shout({ group: Group, message: Message })
        .then(() => {
            console.log(`Shouted to group ${Group} successfully.`)
            res.status(200).send({
                error: null,
                message: `Shouted to group ${Group} successfully.`
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message })
        });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Internal server error: ${err}`);
});

var oneDay = 1000 * 60 * 60 * 24;

setInterval(function () {
  roblox.refreshCookie();
  console.log("Cookie Refreshed.")
}, oneDay);

async function login() {
    await roblox.setCookie(config.user_cookie);
    return await roblox.getCurrentUser();
}

login()
    .then(current_user => {
        console.log(current_user); 
        app.listen(port, function () {
            console.log(`Listening at http://localhost:${port}`);
        });
    })
    .catch(err => {
        let errorApp = express();
        errorApp.get("/*", function (req, res, next) {
            res.json({ error: "Server configuration error: " + err });
        });
        errorApp.listen(port, function () {
            console.log("Error running server: " + err);
        });
    });