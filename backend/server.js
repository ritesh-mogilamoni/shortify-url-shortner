import exp from "express"
import { shortApp } from "./APIs/shorten.js"
import { authRouter } from "./APIs/auth.js"
import { connect } from "mongoose"
import { config } from "dotenv";
import cors from "cors";

config()
const app=exp()

app.use(cors({
  origin: process.env.CLIENT_URL, credentials:true
}));

app.use(exp.json())

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI ;

async function connectToDB(){
    try{
        await connect(MONGODB_URI)

        app.listen(PORT, ()=>{
            console.log(`Server listening on port: ${PORT}`)
        })
    }
    catch(err){
        console.log(err)
    }
}

connectToDB()

app.use("/auth", authRouter)
app.use("/", shortApp)

