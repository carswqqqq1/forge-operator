import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Resources", href: "#resources" },
    { label: "Events", href: "#events" },
    { label: "Business", href: "#business" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-dashed border-primary">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-white font-serif font-bold text-lg">⚒</span>
          </div>
          <span className="font-serif font-bold text-lg hidden sm:inline">Forge</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/login")}
            className="text-sm font-medium"
          >
            Sign in
          </Button>
          <Button
            size="sm"
            className="bg-primary text-foreground hover:bg-primary/90 font-medium"
            onClick={() => setLocation("/login")}
          >
            Sign up
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-dashed border-primary bg-white">
          <nav className="container py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
