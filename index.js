import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import { usersRouter } from './routes/users.js';

dotenv.config()
const app = express();
app.use(cors())
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){
    const client = new MongoClient(MONGO_URL)
    await client.connect();
    console.log("Mongo is connected");
    return client;
}

export const client = await createConnection();
app.use(express.json())

//API endpoints

app.get("/",(request,response)=>{
    response.send("Hello Everyone. Welcome to the Backend application for password reset" )
})

//Routes
app.use('/users',usersRouter)

app.listen(PORT,() => console.log("Server started on port",PORT));