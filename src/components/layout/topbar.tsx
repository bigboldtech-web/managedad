"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Settings, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold md:hidden">ManagedAd</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <div className="flex items-center gap-3 rounded-lg px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/" })}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
