import mongoose from "mongoose";

export async function connectToDatBase() {
    mongoose.connection.on('connected',()=>{
        console.log("Successfully connected to MongoDb")
    })
    await mongoose.connect(process.env.MONGODB_URI)
}