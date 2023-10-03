let express = require('express');
let path = require('path');
const mongoose = require('mongoose')
const cookie_parser = require("cookie-parser")
const jwt = require("jsonwebtoken");
const bcrypt=require('bcrypt')

// MONGO DB connecting
mongoose.connect("mongodb://localhost:27017", { dbName: "backend" })
    .then(() => {
        console.log("connected to mongo db")
    }).catch(err => console.log(err))


// Schema creation 
let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})
// schema as model
let User = mongoose.model("User", userSchema)

let app = express();
// app.get('/', (req, res)=>{

//     let currpath=path.resolve()
//     res.sendFile(path.join(currpath,'index.html'))
// })

// Serving static files in the backend
// app.use(express.static(path.join(path.resolve(),"public")))



// middlewares
app.use(express.json());
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(cookie_parser())



let isAuth = async (req, res, next) => {
    const { token } = req.cookies
    if (token) {
        const decoded = jwt.verify(token, "vinod")
        console.log(decoded)
        req.user = await User.findById(decoded.id)
        next();
    } else {
        res.render("login.ejs")
    }
}
// app.post("/", (req, res) => {
//     res.cookie("token", "iam in", {
//         httpOnly: true,
//         expires: new Date(Date.now() + 60 * 1000)
//     })
//     res.redirect("/logout")
// })

app.get("/login", isAuth, (req, res) => {
    console.log(req.user)
    res.render("index.ejs", { name: req.user.email })
})
app.post("/login", async (req, res) => {
    const { email, password, name } = req.body
    const finded = await User.findOne({ email })
    console.log(finded)
    if (finded) {
        let token=jwt.sign({id:finded._id},"vinod")
        res.cookie("token",token,{httpOnly:true,expires:new Date(Date.now()+60*1000)})
        res.redirect("/login")
    } else {
        res.redirect("/register")
    }
})

app.get("/logout", (req, res) => {
    res.cookie("token", null, { httpOnly: true, expires: new Date(Date.now()) })
    res.redirect("/login")
})
app.get("/success", (req, res) => {
    res.render("index.ejs")
})
// app.post("/",async (req, res) => {
//     let msg=new User(req.body);
//    await msg.save()
//    res.send("success")
// })
app.get("/register", async (req, res) => {
    res.render("register.ejs")
})
app.post("/register", async (req, res) => {
    let {email,password,name}=req.body
    let user=User.findOne({email: email})
    if(user){
      return  res.redirect("/login")
    }else{
        const hashPass=await bcrypt.hash(password,10)
        let newUser = new User({
            name: name,
            email: email,
            password: hashPass
        })
                
        await newUser.save()
    }
   
})
app.listen(4000, () => {
    console.log('server is running');
})