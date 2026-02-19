import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Sidebar from '../navigations/Sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Aidea Breadcrumbs (Auto-generated)
const capitalize = (str) =>
  str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="text-foreground/60 hover:text-foreground transition-colors cursor-default">Dashboard</span>
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        return (
          <React.Fragment key={index}>
            <span className="text-muted-foreground/50">›</span>
            {isLast ? (
              <span className="font-semibold text-foreground">
                {capitalize(value)}
              </span>
            ) : (
              <span className="hover:text-foreground transition-colors cursor-default">
                {capitalize(value)}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Layout = ({ children }) => {
  const [openCommand, setOpenCommand] = useState(false);

  // Command K listener
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={0}>
        <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <SidebarInset>
            <div className="flex-1 flex flex-col">
              {/* Architectural Navbar */}
              <header className="h-16 flex-none sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumbs />
                </div>

                <div className="flex items-center gap-4">
                  {/* Global search and notifications removed */}
                </div>
              </header>

              {/* Content Scroll Area */}
              <main className="flex-1 overflow-auto bg-background p-8">
                <div className="h-full w-full animate-in fade-in-50 duration-700 slide-in-from-bottom-4">
                  {children}
                </div>
              </main>
            </div>
          </SidebarInset>

          {/* Global Command Menu */}
          <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>Projects</CommandItem>
                <CommandItem>Time Charging</CommandItem>
                <CommandItem>Settings</CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
          <Toaster />
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default Layout;
