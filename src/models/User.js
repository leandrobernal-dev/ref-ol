import mongoose, { Schema } from "mongoose";

const userDb = mongoose.connection.useDb("Users");
const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: false,
        },
        username: {
            type: String,
            required: function () {
                return !this.email;
            },
            unique: [true, "Username Already Exist!"],
        },
        email: {
            type: String,
            required: function () {
                return !this.username;
            },
            unique: [true, "Email Already Exist!"],
        },
        password: String,
        provider: {
            type: String,
            default: "credentials",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
const User = userDb.model("Users", UserSchema);
export default User;
