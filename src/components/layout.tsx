import { Link, useLocation } from "wouter";
import { Utensils, MenuSquare, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Pianifica", icon: Utensils },
    { href: "/menu", label: "Menù", icon: MenuSquare },
    { href: "/mappa", label: "Mappa", icon: Map },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">
      {/* Top header — hidden on mobile since bottom nav is present */}
      <header className="hidden md:block bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="font-serif text-2xl font-bold tracking-tight">Colline in Festa</span>
          </Link>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-white/10",
                  location === item.href ? "bg-white/20" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 pt-5 pb-24 md:py-8 max-w-5xl">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50"
           style={{ paddingBottom: "env(safe-area-inset-bottom)", transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}>
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-6 text-xs font-medium transition-colors flex-1",
                location === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", location === item.href ? "text-primary" : "")} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
