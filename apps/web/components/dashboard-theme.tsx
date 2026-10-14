"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useSyncExternalStore, type ReactNode } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-dashboard-theme"
      storageKey="clarivo-dashboard-theme"
      defaultTheme="dark"
      enableSystem={false}
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

const subscribeToHydration = () => () => {};
function useHydratedDashboardTheme() {
  const state = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  return { ...state, theme: hydrated ? state.theme : "dark" };
}

export function useDashboardThemeClass() {
  const { theme } = useHydratedDashboardTheme();
  return cn("owner-theme", theme === "light" ? "light" : "dark");
}

export function DashboardThemeToggle() {
  const { theme, setTheme } = useHydratedDashboardTheme();
  const themeClass = useDashboardThemeClass();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" />}
        aria-label="Choose color theme"
      >
        {theme === "light" ? (
          <SunIcon aria-hidden="true" />
        ) : (
          <MoonIcon aria-hidden="true" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn(themeClass, "min-w-40")}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup
          value={theme === "light" ? "light" : "dark"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="dark">
            <MoonIcon aria-hidden="true" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <SunIcon aria-hidden="true" />
            Light
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
