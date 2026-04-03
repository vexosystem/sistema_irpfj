"use client";

import Link from "next/link";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
];

const MOBILE_BREAKPOINT = "(max-width: 767px)";
const MOBILE_SCROLL_HIDE_OFFSET = 96;
const MOBILE_SCROLL_DELTA = 18;
const MOBILE_HEADER_TRANSITION_MS = 320;

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, mounted, toggleTheme } = useTheme();
  const headerRef = useRef<HTMLElement | null>(null);
  const lastScrollYRef = useRef(0);
  const transitionLockRef = useRef<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileHeaderHidden, setIsMobileHeaderHidden] = useState(false);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

    const syncViewport = () => {
      const nextIsMobile = mediaQuery.matches;
      setIsMobileViewport(nextIsMobile);
      setIsMobileHeaderHidden(false);
      lastScrollYRef.current = window.scrollY;
    };

    syncViewport();

    const handleChange = () => {
      syncViewport();
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (transitionLockRef.current !== null) {
        window.clearTimeout(transitionLockRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lockHeaderTransition = (nextScrollY: number) => {
      if (transitionLockRef.current !== null) {
        window.clearTimeout(transitionLockRef.current);
      }

      lastScrollYRef.current = nextScrollY;
      transitionLockRef.current = window.setTimeout(() => {
        lastScrollYRef.current = window.scrollY;
        transitionLockRef.current = null;
      }, MOBILE_HEADER_TRANSITION_MS);
    };

    const handleScroll = () => {
      if (!isMobileViewport || transitionLockRef.current !== null) {
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 24) {
        if (isMobileHeaderHidden) {
          setIsMobileHeaderHidden(false);
          lockHeaderTransition(currentScrollY);
          return;
        }

        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (Math.abs(scrollDelta) < MOBILE_SCROLL_DELTA) {
        return;
      }

      if (scrollDelta > 0 && currentScrollY > MOBILE_SCROLL_HIDE_OFFSET && !isMobileHeaderHidden) {
        setIsMobileHeaderHidden(true);
        lockHeaderTransition(currentScrollY);
        return;
      }

      if (scrollDelta < 0 && isMobileHeaderHidden) {
        setIsMobileHeaderHidden(false);
        lockHeaderTransition(currentScrollY);
        return;
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobileHeaderHidden, isMobileViewport]);

  useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) {
      return;
    }

    const element = headerRef.current;

    const updateHeight = () => {
      if (!headerRef.current) {
        return;
      }

      const nextHeight = headerRef.current.getBoundingClientRect().height;
      setMobileHeaderHeight(nextHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(element);
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [actions, subtitle, title, mounted, theme]);

  return (
    <div className="min-h-screen bg-app-gradient">
      <header
        className={cn(
          "z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl transition-transform duration-300 ease-out md:sticky md:top-0 md:translate-y-0",
          "fixed inset-x-0 top-0",
          isMobileViewport && isMobileHeaderHidden ? "-translate-y-[calc(100%+1px)]" : "translate-y-0",
        )}
        ref={headerRef}
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary sm:text-xs">
                Sistema Imposto de Renda
              </p>
              <div className="min-w-0">
                <h1 className="break-words text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={toggleTheme} type="button" variant="secondary">
                {mounted && theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                {mounted && theme === "light" ? "Modo escuro" : "Modo claro"}
              </Button>
              <LoadingButton
                className="w-full sm:w-auto"
                loading={isSigningOut}
                loadingText="Saindo..."
                onClick={async () => {
                  setIsSigningOut(true);

                  try {
                    await signOutUser();
                    router.push("/login");
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
                type="button"
                variant="secondary"
              >
                Sair
              </LoadingButton>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                    pathname.startsWith(link.href)
                      ? "bg-primary text-slate-950"
                      : "border border-border bg-surface-strong text-secondary hover:bg-surface",
                  )}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {actions ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div
        aria-hidden="true"
        className="transition-[height] duration-300 ease-out md:hidden"
        style={{ height: isMobileViewport && !isMobileHeaderHidden ? mobileHeaderHeight : 0 }}
      />

      <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
