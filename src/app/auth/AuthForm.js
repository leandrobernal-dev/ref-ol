import { useState } from "react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export function AuthForm({ authType, toggleAuthType }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const callbackUrl = searchParams.get("callbackUrl")
        ? searchParams.get("callbackUrl")
        : "/";

    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async (e) => {
        await signIn("google", {
            callbackUrl: callbackUrl,
        });
    };
    const handleGithubLogin = async (e) => {
        await signIn("github", {
            callbackUrl: callbackUrl,
        });
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        const formElements = event.currentTarget.elements;
        const data = {
            email: formElements.email.value,
            password: formElements.password.value,
        };
        await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })
            .then(({ ok, error }) => {
                if (ok) {
                    router.push(callbackUrl);
                } else {
                    console.log(error);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return (
        <div className="grid gap-6">
            {/* <form onSubmit={handleLogin}>
                <div className="grid gap-2">
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            name="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="sr-only" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            id="password"
                            placeholder="*******"
                            type="password"
                            name="password"
                            autoCapitalize="none"
                            autoComplete="password"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <Button disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {authType === "signin" ? "Sign In" : "Sign Up"}
                    </Button>
                    <span className="mt-2">
                        {authType === "signin" ? (
                            <small className="text-zinc-400">
                                Don’t have an account yet?{" "}
                                <Button
                                    variant={"link"}
                                    type="button"
                                    className="p-0"
                                    onClick={toggleAuthType}
                                >
                                    Sign up
                                </Button>
                            </small>
                        ) : (
                            <small className="text-zinc-400">
                                Already have an account?{" "}
                                <Button
                                    variant={"link"}
                                    type="button"
                                    className="p-0"
                                    onClick={toggleAuthType}
                                >
                                    Sign in
                                </Button>
                            </small>
                        )}
                    </span>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div> */}
            <div className="flex flex-col gap-2">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGithubLogin}
                    type="button"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Icons.gitHub className="mr-2 h-4 w-4" />
                    )}{" "}
                    Github
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    type="button"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Icons.google className="mr-2 h-4 w-4" />
                    )}{" "}
                    Google
                </Button>
            </div>
        </div>
    );
}
