let express = require("express");
let app = express();

app.use(express.urlencoded({ extended: true })); // parses the urlencoded body

let handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({ defaultLayout: false }));
app.set("view engine", "handlebars");

let sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("./db.sqlite3");
let session = require("express-session");

app.use(express.static("public"));

app.use(
    session({
        secret: "some secret code",
        resave: false, // forces sessions to be saved
        saveUninitialized: false // forces uninitialized sessions to be saved
    })
);

let limitLength = function(string, maxLength) {
    if (string.length > maxLength) {
        string = string.slice(0, maxLength) + "..."
    }
    return string
}

app.get("/", function(req, res) {
    db.all("SELECT *,   DATETIME(time_added,'localtime') as time_added FROM post ORDER BY id DESC ", [], function(err, rows) {
        console.log(rows);
        res.render("posts", {
            layout: "main",
            posts: rows,
            helpers: {
                limit: limitLength
            }
        });
    });
});

app.post("/", function(req, res) {
    let title = req.body["title"];
    let content = req.body["content"];
    db.run("INSERT INTO post(Title, Content) VALUES(?,?)", [title, content], function(err) {
        res.redirect("back");
        console.log(req.body)
    });
});

app.get("/count", function(req, res) {
    if (!req.session['count']) { // if 'count' is not found in the user's session
        req.session['count'] = 0; // set the initial value to 0
    }
    req.session['count']++;
    res.send("Count: " + req.session['count']);
})


//app.get('/', function(req, res) {
    //res.render("posts", {
        //layout: "main"
    //})
//});

app.get('/after', function(req, res) {
    db.all("SELECT *,   DATETIME(time_added,'localtime') as time_added FROM post ORDER BY id DESC ", [], function(err, rows) {
        console.log(rows);
        res.render("posts", {
            layout: "after",
            posts: rows,
            helpers: {
                limit: limitLength
            }
        });
    });
});



app.get('/log', function(req, res) {
    res.render("login", {
        layout: "main"
    })
});

app.get('/regi', function(req, res) {
    res.render("register", {
        layout: "main"
    })
});



app.post("/login", function(req, res) {
    let username = req.body['username'];
    let password = req.body['password'];
    db.get("SELECT * FROM user WHERE username=? AND password=?", [username, password], function(err, row) {
        if (row) {
            req.session['username'] = username;
            res.redirect("/after");
        } else {
            res.send("Invalid login information.");
        }
    })
});

app.post("/register", function(req, res) {
    let username = req.body['username'];
    let password = req.body['password'];
    db.run("INSERT INTO user(Username,Password) VALUES(?,?)", [username, password], function(err) {
        res.render("login")
    })
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.get("/delete/:id", function(req, res) {
    db.run("DELETE FROM post WHERE id=?", req.params["id"], function(err) {
        res.redirect("back");
    });
    console.log(req.body)
});
// app.get("/topic/:id", function (req, res) {
//     db.get("SELECT * FROM post where id =?", req.params.id, function (err, rows) {
//         console.log(err);
//         db.all("SELECT * FROM comments WHERE post_id = ?", req.params.id, function (err, comments) {
//             res.render("view", {
//                 "post": rows,
//                 "comments": comments
//             });

//         })
//     });
// })

// app.post("/comments/:id", function (req, res) {
//     let content = req.body.comment;
//     console.log(req.params.id);
//     let id = req.params.id

//     db.run("INSERT INTO comments(Content,post_id) VALUES(?,?)", [content, id], function (err) {
//         console.log(err)
//         res.redirect("back");
//     });
// });


app.get('/topic/:id', function(req, res) {
    let postID = req.params['id'];
    db.get("SELECT * FROM post WHERE id=?", postID, function(err, post) {
        db.all("SELECT *,   DATETIME(time_added,'localtime') as time_added FROM comment WHERE post_id=?", postID, function(err, comments) {
            res.render("view", {
                
                layout: "after",
                "post": post,
                "comments": comments
            });
        })
    });
});


app.post("/topic/:index", function(req, res) {
    let content = req.body["content"];
    let id = req.params.index;
    db.run("INSERT INTO comment(post_id, content) VALUES(?,?)", [id, content], function(err) {
        res.redirect("back");
    });
})

app.get("/deletee/:id", function(req, res) {
    db.run("DELETE FROM comment WHERE id=?",
        req.params['id'],
        function(err) {
            res.redirect("back")
        });
});




app.listen(8000, function() {
    console.log("Listening on port 8000");
});

