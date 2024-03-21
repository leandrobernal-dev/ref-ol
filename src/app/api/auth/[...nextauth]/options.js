import GoogleProvider from "next-auth/providers/google";
import GithubProvicer from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcrypt";
import User from "@/models/User";
import dbConnect from "@/db/database";

export const options = {
    providers: [
        // CredentialsProvider({
        //     name: "Credentials",
        //     credentials: {
        //         email: {
        //             label: "Email:",
        //             type: "text",
        //             placeholder: "Your Email",
        //         },
        //         password: {
        //             label: "Password",
        //             type: "password",
        //             placeholder: "*******",
        //         },
        //     },
        //     async authorize(credentials) {
        //         await dbConnect();
        //         const user = await User.findOne({
        //             email: credentials.email,
        //         });
        //         if (!user) throw new Error("Email or Password is Incorrect!");

        //         const compare = await bcrypt.compare(
        //             credentials.password,
        //             user.password
        //         );
        //         if (!compare)
        //             throw new Error("Email or Password is Incorrect!");

        //         return user;
        //     },
        // }),
        GithubProvicer({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth",
    },
    callbacks: {
        signIn: async ({ user, profile, account, email, credentials }) => {
            // console.log({ account, profile });
            if (account.type === "oauth") {
                await dbConnect();
                return await signInWithOAuth({ account, profile });
            }
            return true;
        },
        jwt: async ({ token, trigger, session }) => {
            // console.log(token);
            const user = await getUserByEmail({ email: token.email });
            if (user?._id) {
                token = { ...token, _id: user._id };
            }
            return token;
        },
        session: async ({ session, token }) => {
            session.user.userData = {
                id: token._id,
            };
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
};

async function signInWithOAuth({ account, profile }) {
    let user;
    let newUser = new User({
        name: profile.name,
        provider: account.provider,
    });
    // console.log(profile);

    if (account.provider === "github") {
        user = await User.findOne({ username: profile.login });
        if (user) return true;
        newUser.username = profile.login;
    } else {
        user = await User.findOne({ email: profile.email });
        if (user) return true;
        newUser.email = profile.email;
    }

    await newUser.save();

    return true;
}

async function getUserByEmail({ email }) {
    const user = await User.findOne({ email: email });

    if (!user) throw new Error("Email does not exist");

    return { ...user._doc, _id: user._id.toString() };
}
