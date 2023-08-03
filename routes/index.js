var express = require("express");
var router = express.Router();
const nodemailer = require("nodemailer");
const upload = require("../helpers/multer").single("avatar");
const fs = require("fs");
const User = require("../models/userModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { title } = require("process");
passport.use(new LocalStrategy(User.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", {
        title: "Homepage",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// get create page//
router.get("/create", isLoggedIn, function (req, res, next) {
    res.render("create", {
        title: "Create",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// get show page//

router.get("/show", isLoggedIn, function (req, res, next) {
    res.render("show", {
        title: "Show",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

//get signup page //

router.get("/signup", function (req, res, next) {
    res.render("signup", {
        title: "Signup",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// get signin page //

router.get("/signin", function (req, res, next) {
    res.render("signin", {
        title: "Signin",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// post signup page //

router.post("/signup", function (req, res, next) {
    const { username, email, contact, password } = req.body;
    User.register({ username, email, contact }, password)
        .then((user) => {
            res.redirect("/signin");
        })
        .catch((err) => res.send(err));
});

router.get("/profile", isLoggedIn, function (req, res, next) {
    console.log(req.user);
    res.render("profile", 
    {
        title: "Profile",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// post signin page //
router.post(
    "/signin",
    passport.authenticate("local", {
        successRedirect: "/profile",
        failureRedirect: "/signin",
    }),
    function (req, res, next) { }
);

// get signout page //
router.get("/signout", isLoggedIn, function (req, res, next) {
    req.logout(() => {
        res.redirect("/signin");
    });
});

// Get forget page //

router.get("/forget-password", function (req, res, next) {
    res.render("forget", {
        title: "Forget-Password",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});




// get update page //

router.get("/update/:id", isLoggedIn, function (req, res, next) {
    res.render("update", {
        title: "Update",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// post update page //
router.post("/update/:id", isLoggedIn, async function (req, res, next) {
    try {
        const { username, email, contact, linkedin, github, behance } =
            req.body;

        const updatedUserInfo = {
            username,
            email,
            contact,
            links: { linkedin, github, behance },
        };

        await User.findOneAndUpdate(req.params.id, updatedUserInfo);
        res.redirect("/update/" + req.params.id);
    } catch (error) {
        res.send(err);
    }
});


/* GET forgetpassword page. */
router.get("/forgetpassword", function (req, res, next) {
    res.render("getpassword", {
        title: "Forget Password",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// POST forgetpassword page. */
router.post("/forgetpassword/:id", async function (req, res, next) {
    var currentUser = await User.findOne({ _id: req.params.id });
    if (currentUser.otp == `${req.body.code}`) {
        res.redirect('/getpassword')
    }
    else {
        res.send('wrong otp')
    }
    res.redirect("/signin");
});

/* POST send-mail page. */
router.post("/send-mail", async function (req, res, next) {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send("user not found");

    const mailurl = `${req.protocol}://${req.get("host")}/forgetpassword/${
        user._id
    }`;
    const code = Math.floor(Math.random() * 9000 + 1000);

    user.otp = `${code}`
    await user.save()
    // -----Node mailer coding--------------

    const transport = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: "sanskarchaurey2000@gmail.co",
            pass: "ysqeqahybcfiaikj",
        },
    });

    const mailOptions = {
        from: "shri sanskar pvt ltd.",
        to: req.body.email,
        subject: "Password Reset Link",
        text: "Do not share this link to anyone.",
        html: `<p>Do not share this Code to anyone.</p><h1>${code}</h1>`,
    };

    transport.sendMail(mailOptions, async (err, info) => {
        if (err) return res.send(err);
        console.log(info);

        await User.findByIdAndUpdate(user._id, { code });
        id = await User.findById(user._id)

        // return res.send(
        //     "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1>"
        // );

        res.redirect("/code/" + user._id);
    });
});

// GET getcode page //
router.get("/code/:id", function (req, res, next) {
    res.render("getcode", {
        title: "code",
        isLoggedIn: req.user ? true : false,
        user: req.user,
        id: req.params.id
    });
});

// POST getcode page //
router.post("/code/:id", async function (req, res, next) {
    const user = await User.findById(req.params.id);
    if (user.code == req.body.code) {
        await User.findByIdAndUpdate(user._id, { code: "" });
        res.redirect("/forgetpassword/" + user._id);
    } else {
        res.send("invalid code.");
    }
});

router.get("/reset-password", isLoggedIn, function (req, res, next) {
    res.render("reset", {
        title: "Reset-Password",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// post reset password page //

router.post("/reset-password", isLoggedIn, async function (req, res, next) {
    try {
        await req.user.changePassword(
            req.body.oldPassword,
            req.body.newPassword
        );
        await req.user.save();
        res.redirect("/profile");
    } catch (error) {
        res.send(err);
    }
});

// post upload page //
router.post("/upload", isLoggedIn, async function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log("ERROR>>>>>", err.message);
            res.send(err.message);
        }
        if (req.file) {
            fs.unlinkSync("./public/images/" + req.user.avatar);
            req.user.avatar = req.file.filename;
            req.user
                .save()
                .then(() => {
                    res.redirect("/update/" + req.user._id);
                })
                .catch((err) => {
                    res.send(err);
                });
        }
    });
});


//                 resumes                  //

// get education page //
router.get("/education", isLoggedIn, function (req, res, next) {
    res.render("Resume/Education", {
        title: "Education",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// add education post //
router.post("/add-edu", isLoggedIn, async function (req, res, next) {
    req.user.education.push(req.body);
    await req.user.save();
    res.redirect("/education");
});


// delete education //
router.get("/delete-edu/:index", isLoggedIn, async function (req, res, next) {
    const eduCopy = [...req.user.education];
    eduCopy.splice(req.params.index, 1);
    req.user.education = [...eduCopy];
    await req.user.save();
    res.redirect("/education");
});


// get skill page //
router.get("/skill", isLoggedIn, function (req, res, next) {
    res.render("Resume/skill", {
        title: "Skill",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// add skill post //
router.post("/add-skill", isLoggedIn, async function (req, res, next) {
    req.user.skill.push(req.body);
    await req.user.save();
    res.redirect("/skill");
});


// delete skill //
router.get("/delete-skill/:index", isLoggedIn, async function (req, res, next) {
    const skillCopy = [...req.user.skill];
    skillCopy.splice(req.params.index, 1);
    req.user.skill = [...skillCopy];
    await req.user.save();
    res.redirect("/skill");
});


// get project page //
router.get("/project", isLoggedIn, function (req, res, next) {
    res.render("Resume/project", {
        title: "Project",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// add project post //
router.post("/add-project", isLoggedIn, async function (req, res, next) {
    req.user.project.push(req.body);
    await req.user.save();
    res.redirect("/project");
});


// delete project //
router.get("/delete-project/:index", isLoggedIn, async function (req, res, next) {
    const projectCopy = [...req.user.project];
    projectCopy.splice(req.params.index, 1);
    req.user.project = [...projectCopy];
    await req.user.save();
    res.redirect("/project");
});



// get experience page //
router.get("/experience", isLoggedIn, function (req, res, next) {
    res.render("Resume/experience", {
        title: "experience",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// add experience post //
router.post("/add-experience", isLoggedIn, async function (req, res, next) {
    req.user.experience.push(req.body);
    await req.user.save();
    res.redirect("/experience");
});


// delete experience //
router.get("/delete-experience/:index", isLoggedIn, async function (req, res, next) {
    const experienceCopy = [...req.user.experience];
    experienceCopy.splice(req.params.index, 1);
    req.user.experience = [...experienceCopy];
    await req.user.save();
    res.redirect("/experience");
});

// get interest page //
router.get("/interest", isLoggedIn, function (req, res, next) {
    res.render("Resume/interest", {
        title: "interest",
        isLoggedIn: req.user ? true : false,
        user: req.user,
    });
});

// add interest post //
router.post("/add-interest", isLoggedIn, async function (req, res, next) {
    req.user.interest.push(req.body);
    await req.user.save();
    res.redirect("/interest");
});

// delete experience //
router.get("/delete-interest/:index", isLoggedIn, async function (req, res, next) {
    const interestCopy = [...req.user.interest];
    interestCopy.splice(req.params.index, 1);
    req.user.interest = [...interestCopy];
    await req.user.save();
    res.redirect("/interest");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/signin");
    }
}

module.exports = router;
