if(process.env.NODE_ENV != "production") {
require("dotenv").config();
}

process.on('warning', (warning) => {
  console.warn(warning.stack);
});

const express = require("express");
const app = express();
const mongoose = require("mongoose");
  
// line 4 ka code copilot se likhe hai,
// because code from course is not working...
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require("./models/listing");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const listingController = require("./controllers/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");
const MongoStore = require("connect-mongo");


const dbUrl = process.env.ATLAS_URL;


main()
.then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log("DB connection error:", err);
});


async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join (__dirname,"/public")));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600
});

store.on("error", () => {
    console.log("ERROR IN MONGO STORE", err);
});


const sessionOptions = {
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 *1000,
        maxAge: 7 * 24 * 60 * 60 *1000,
        httpOnly: true,
    }
};



// app.get("/", (req,res) => {
//     res.send("Hi, I am root");
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


app.get("/", wrapAsync(listingController.index));


// app.get("/demouser", async(req,res) => {
//     let fakeUser = new User({
//         email: "student@h=gmail.com",
//         username: "delta-student"
//     });

//    let registeredUser = await User.register(fakeUser, "helloworld");
//    res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.use((err, req, res, next) => {
    let{statusCode=500, message="something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", {message});
    
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

// const port = process.env.PORT || 10000; // fallback if Render doesn't supply PORT
// app.listen(port, '0.0.0.0', () => {
//   console.log(`✔ Server is running on port ${port}`);
// });
