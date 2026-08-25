import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
    name: { required: true, type: String },
    email: { required: true, type: String, unique: true, lowercase: true, trim: true },
    password: { required: true, type: String }
}, { timestamps: true })

//Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

//method to compare password
userSchema.methods.comparePassword = async function(Password){
    return bcrypt.compare(Password, this.password)
}

export const User = model("User", userSchema);