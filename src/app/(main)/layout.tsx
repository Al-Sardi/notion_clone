"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { Navigation } from "@/components/navigation";

const MainLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!userId) {
    return redirect("/");
  }

  return (
    <div className="h-full flex dark:bg-[#1F1F1F]">
      <Navigation />
      <main className="flex-1 h-full overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}

export default MainLayout; 