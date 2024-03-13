export { default } from "next-auth/middleware";

export const config = {
    // matcher: ["/api:path*", "/((?!auth|public|favicon.ico).*)"],
    matcher: ["/app/:path*", "/api:path*"],
};
