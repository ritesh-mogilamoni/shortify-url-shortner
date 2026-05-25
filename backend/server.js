import exp from "express"
import { shortApp } from "./APIs/shorten.js"
import { authRouter } from "./APIs/auth.js"
import { connect } from "mongoose"
import cors from "cors";

const app=exp()

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(exp.json())

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/url-shortner-db";

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

