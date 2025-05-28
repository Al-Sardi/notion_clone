"use client";

import { ChevronsLeftRight } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { memo, useMemo } from "react";

const UserItemContent = memo(function UserItemContent({ 
  imageUrl, 
  fullName, 
  email 
}: { 
  imageUrl?: string;
  fullName?: string;
  email?: string;
}) {
  return (
    <>
      <div className="flex flex-col space-y-4 p-2">
        <p className="text-xs font-medium leading-none text-muted-foreground">
          {email}
        </p>
        <div className="flex items-center gap-x-2">
          <div className="rounded-md bg-secondary p-1 dark:bg-neutral-800">
            <Avatar className="h-8 w-8">
              <AvatarImage src={imageUrl} />
            </Avatar>
          </div>
          <div className="space-y-1">
            <p className="text-sm line-clamp-1 text-foreground">
              {fullName}&apos;s Notion
            </p>
          </div>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="w-full cursor-pointer text-muted-foreground hover:text-foreground">
        <SignOutButton>
          Log out
        </SignOutButton>
      </DropdownMenuItem>
    </>
  );
});

export const UserItem = () => {
  const { user } = useUser();

  const userInfo = useMemo(() => ({
    imageUrl: user?.imageUrl,
    fullName: user?.fullName || undefined,
    email: user?.emailAddresses[0]?.emailAddress
  }), [user?.imageUrl, user?.fullName, user?.emailAddresses]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div role="button" className="flex items-center text-sm p-3 w-full hover:bg-primary/5 dark:hover:bg-neutral-600">
          <div className="gap-x-2 flex items-center max-w-[150px]">
            <Avatar className="h-5 w-5">
              <AvatarImage src={userInfo.imageUrl} />
            </Avatar>
            <span className="text-start font-medium line-clamp-1 text-muted-foreground">
              {userInfo.fullName}&apos;s Notion
            </span>
          </div>
          <ChevronsLeftRight className="rotate-90 ml-2 text-muted-foreground h-4 w-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align="start"
        alignOffset={11}
        forceMount
      >
        <UserItemContent {...userInfo} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 