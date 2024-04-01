"use client";
import { AuthForm } from "@/app/auth/AuthForm";
import { siteConfig } from "@/config/config";
import Link from "next/link";
import { Suspense } from "react";

export default function AuthPage() {
    return (
        <div className="w-full h-screen flex items-center justify-center">
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 ">
                        <h1 className="text-5xl pb-4 text-center font-bold tracking-tight">
                            {siteConfig.site.title}
                        </h1>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Login OR create a new account
                        </h2>
                    </div>
                    <Suspense>
                        <AuthForm />
                    </Suspense>
                    <p className="text-muted-foreground px-8 text-center text-sm">
                        By clicking continue, you agree to our{" "}
                        <Link
                            href="#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/#"
                            className="hover:text-primary underline underline-offset-4"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
