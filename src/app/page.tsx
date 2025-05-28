"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6">
        <Logo />
        <div className="flex items-center gap-x-4">
          <ModeToggle />
          {isSignedIn ? (
            <div className="flex items-center gap-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents">Enter Notion</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center gap-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Notion Free</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-10">
        <h1 className="text-3xl md:text-6xl font-bold">
          Write, plan, share.<br />
          With AI at your side.
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mt-4 max-w-3xl mx-auto">
          Notion is the connected workspace where better, faster work happens.
        </p>
        {isSignedIn ? (
          <Button size="lg" className="mt-6" asChild>
            <Link href="/documents">Open Notion</Link>
          </Button>
        ) : (
          <Button size="lg" className="mt-6" asChild>
            <Link href="/sign-up">Get Notion Free</Link>
          </Button>
        )}
      </main>
    </div>
  );
}
