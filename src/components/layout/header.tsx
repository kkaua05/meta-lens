"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Site header with brand and theme toggle. */
export function Header() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SearchIcon className="size-4" />
          </span>
          <span className="text-lg tracking-tight">MetaLens</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <SunIcon className="size-4 dark:hidden" />
          <MoonIcon className="hidden size-4 dark:block" />
        </Button>
      </div>
    </header>
  );
}