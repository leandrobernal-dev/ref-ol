import dbConnect from "@/db/database";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export default async function getCurrentUser() {
    await dbConnect();
    const { user } = await getServerSession();
    const currentUser = await User.findOne(
        user.email ? { email: user.email } : { username: user.name }
    );
    return currentUser;
}
