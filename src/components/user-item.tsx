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
    <div className="w-full">
      <div className="flex flex-col space-y-4 p-4">
        <p className="text-xs font-medium text-muted-foreground px-2">
          {email}
        </p>
        <div className="flex items-center gap-x-3 px-2">
          <div className="rounded-md bg-secondary p-1 dark:bg-neutral-800">
            <Avatar className="h-10 w-10">
              <AvatarImage src={imageUrl} />
            </Avatar>
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate">
              {fullName}&apos;s Notion
            </p>
            <p className="text-xs text-muted-foreground">
              View account
            </p>
          </div>
        </div>
      </div>
      <div className="w-full border-t border-gray-200 dark:border-gray-800 my-2"></div>
      <div className="p-2">
        <DropdownMenuItem asChild className="w-full p-0">
          <div className="w-full">
            <SignOutButton>
              <button className="w-full text-left cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-foreground">
                Log out
              </button>
            </SignOutButton>
          </div>
        </DropdownMenuItem>
      </div>
    </div>
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
        className="w-full rounded-none border-0 shadow-none bg-transparent"
        align="start"
        side="right"
        sideOffset={0}
        alignOffset={0}
        forceMount
      >
        <div className="bg-gray-100 dark:bg-[#171717] border-t border-gray-200 dark:border-gray-800">
          <UserItemContent {...userInfo} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 