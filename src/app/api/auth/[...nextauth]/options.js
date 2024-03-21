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
        async signIn({ user, profile, account, email, credentials }) {
            // console.log({ account, profile });
            if (account.type === "oauth") {
                await dbConnect();
                return await signInWithOAuth({ account, profile });
            }
            return true;
        },
        async jwt({ token, trigger, session }) {
            // console.log(token);
            const user = await getUserByEmail({ email: token.email });
            // console.log(user);
            return token;
        },
        async session({ session, token }) {
            return session;
        },
    },
};

async function signInWithOAuth({ account, profile }) {
    if (account.provider === "github") {
        const user = await User.findOne({ username: profile.login });
        if (user) return true;
        const newUser = new User({
            username: profile.login,
            name: profile.name,
            provider: account.provider,
        });
        await newUser.save();

        return true;
    }
    const user = await User.findOne({ email: profile.email });
    if (user) return true;

    const newUser = new User({
        email: profile.email,
        name: profile.name,
        provider: account.provider,
    });
    await newUser.save();
    return true;
}

async function getUserByEmail({ email }) {
    const user = await User.findOne({ email: email });

    if (!user) throw new Error("Email does not exist");

    return { ...user._doc, _id: user._id.toString() };
}
