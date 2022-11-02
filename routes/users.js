import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { client } from "../index.js";
import NodeMailer from 'nodemailer';
import { ObjectId } from "mongodb";

const router = express.Router();

router.post("/signup", async (request, response) => {
    const { email, password } = request.body;

    const isUserExist = await client.db("b37wd").collection("users").findOne({ email: email })

    if (isUserExist) {
        response.status(400).send({ message: "Username already taken" })
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)
    const result = await client.db("b37wd").collection("users").insertOne({ email: email, password: hashedPassword });
    response.send(result)
})

router.post("/forgot-password", async (request, response) => {
    const { email } = request.body;
    try{
        //Make sure user exists in database
        const oldUser = await client.db("b37wd").collection("users").findOne({ email: email })
        if (!oldUser) {
            response.status(400).send({ message: "User not exists!!" })
            return;
        }
        const secret = process.env.SECRET_KEY + oldUser.password
        const payload = {
            email: oldUser.email,
            id: oldUser._id
        }
        //User exist and now create a one time link valid for 15 minutes
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        const link = `https://password-reset-bdc407.netlify.app/reset-password/${oldUser._id}/${token}`;
        var transporter = NodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'panmonikmm@gmail.com',
                pass: 'lxkugchepioxgtmr'
            }
        });
        var mailOptions = {
            from: 'panmonikmm@gmail.com',
            to: `${oldUser.email}`,
            subject: 'Password reset link',
            html: `We have received your request for reset password. Click this link to reset your password.<br>
                  <a href = ${link}>Click Here</a><br>
                  <p>This link is valid for 15 minutes from your request initiation for password recovery.</p>`
        };
    
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('Email sent:' + info.response);
            }
        })  
        response.send({message: "Email sent successfully"})
    } 
    catch(error){
        response.send({ status: "error", data: error})
    }

   
})

//reset password
router.get("/reset-password/:id/:token", async (request, response) => {
    const { id, token } = request.params;
    //check if this id exist in database
    const oldUser = await client.db("b37wd").collection("users").findOne({ _id: ObjectId(id) })
    if(!oldUser){
        response.status(400).send({ message: "User not exists!!"})
        return;
    }
    const secret = process.env.SECRET_KEY + oldUser.password;  
    try{
        const verify = jwt.verify(token,secret)
        response.send("Verified")
    }
    catch(error){
        response.send("Not Verified")
    }           
    }
)

router.post("/reset-password/:id/:token", async (request, response) => {
    const { id, token } = request.params;
    const { password } = request.body;

    //check if this id exist in database
    const oldUser = await client.db("b37wd").collection("users").findOne({ _id: ObjectId(id) })
    if(!oldUser){
        response.status(400).send({ message: "User not exists!!"})
        return;
    }
    const secret = process.env.SECRET_KEY + oldUser.password;  
    try{
        const verify = jwt.verify(token,secret)
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password,salt)
        const updatePassword = await client.db("b37wd").collection("users").updateOne({ _id: ObjectId(id) }, { $set: {password : encryptedPassword} })
        response.send({message: "Password updated"})
    }
    catch(error){
        response.send({message: "Something went wrong"})
    }           
})


export const usersRouter = router;