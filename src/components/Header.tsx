import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Truck, Plus, Search, User, LogIn, LogOut, Zap, UserCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-volta-express.webp";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { label: "Início", href: "/", icon: Truck },
    { label: "Oportunidades", href: "/buscar", icon: Search },
    { label: "Match de frete", href: "/matching", icon: Zap },
    { label: "Anunciar", href: "/criar-anuncio", icon: Plus },
    ...(user ? [{ label: "Meu painel", href: "/painel", icon: LayoutDashboard }] : []),
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Volta Express — página inicial" className="h-14 w-auto" width={56} height={56} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  Perfil
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <User className="h-4 w-4" />
                  Criar conta
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:hidden"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            {user ? (
              <>
                <Link to="/perfil" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <UserCircle className="h-4 w-4" />
                    Perfil
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
                <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-start gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    <User className="h-4 w-4" />
                    Criar conta
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
