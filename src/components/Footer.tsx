/*
 * Footer.tsx — rodapé da plataforma (v3, T4.4).
 * Contatos e redes oficiais vêm de src/lib/privacidade.ts (os mesmos da landing e do Hub).
 * Cores dos tokens do design system (sem hexadecimais soltos).
 */
import { Link } from "react-router-dom";
import { Mail, Phone, Instagram, Facebook, Youtube, ExternalLink } from "lucide-react";
import logo from "@/assets/logo-volta-express.webp";
import { useAuth } from "@/contexts/AuthContext";
import { CONTATO, REDES } from "@/lib/privacidade";
import { LINKS } from "@/lib/links";

/* Ícones das marcas sem equivalente no lucide (X e TikTok). */
const IconeX = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconeTikTok = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.58-4.11-1.34a7.159 7.159 0 0 1-2.13-2.12c-.05 3.32.02 6.63-.02 9.95a7.12 7.12 0 0 1-1.2 4.07 7.06 7.06 0 0 1-4.8 3.01 7.28 7.28 0 0 1-5.38-1.02 7.15 7.15 0 0 1-3.2-4.57 7.13 7.13 0 0 1 1.7-6.28 7.07 7.07 0 0 1 5.37-2.61c.01 1.39.01 2.78.01 4.17-.9-.05-1.84.14-2.61.64a3.1 3.1 0 0 0-1.2 2.44 3.1 3.1 0 0 0 3.1 3.2 3.11 3.11 0 0 0 3.2-3.13V0h.01Z" />
  </svg>
);
const ICONES: Record<string, () => JSX.Element> = {
  Instagram: () => <Instagram className="h-5 w-5" aria-hidden="true" />,
  Facebook: () => <Facebook className="h-5 w-5" aria-hidden="true" />,
  YouTube: () => <Youtube className="h-5 w-5" aria-hidden="true" />,
  X: IconeX,
  TikTok: IconeTikTok,
};

const linkClasse = "inline-flex min-h-8 items-center text-white/80 transition-colors hover:text-white";
const tituloClasse = "mb-4 text-sm font-bold uppercase tracking-widest text-[hsl(var(--brand-amber))]";

const Footer = () => {
  const { user } = useAuth();
  return (
    <footer className="border-t border-white/10 bg-[hsl(var(--sidebar-background))] text-white">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <img src={logo} alt="Volta Express Brasil" className="h-14 w-auto object-contain" />
            <p className="text-sm leading-relaxed text-white/80">
              Conectamos quem tem caminhão a quem tem carga no mesmo caminho, para nenhuma viagem voltar vazia.
            </p>
            <ul className="flex flex-wrap items-center gap-2" aria-label="Redes sociais">
              {REDES.map((r) => {
                const Icone = ICONES[r.nome];
                return (
                  <li key={r.nome}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${r.nome} da Volta Express Brasil`}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-accent"
                    >
                      <Icone />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <nav aria-label="Plataforma">
            <h2 className={tituloClasse}>Plataforma</h2>
            <ul className="space-y-2 text-sm">
              <li><Link to="/buscar" className={linkClasse}>Oportunidades</Link></li>
              <li><Link to="/matching" className={linkClasse}>Match de frete</Link></li>
              <li><Link to="/criar-anuncio" className={linkClasse}>Anunciar</Link></li>
              <li><Link to={user ? "/painel" : "/login"} className={linkClasse}>{user ? "Meu painel" : "Entrar"}</Link></li>
              {!user && <li><Link to="/cadastro" className={linkClasse}>Criar conta grátis</Link></li>}
            </ul>
          </nav>

          <nav aria-label="Ecossistema Volta Express">
            <h2 className={tituloClasse}>Ecossistema</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={LINKS.landing} target="_blank" rel="noopener noreferrer" className={`${linkClasse} gap-1`}>
                  Site Volta Express Brasil <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href={LINKS.hub} target="_blank" rel="noopener noreferrer" className={`${linkClasse} gap-1`}>
                  Hub: pesquisa, jornada e relatórios <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
              <li><Link to="/privacidade" className={linkClasse}>Política de Privacidade</Link></li>
              <li><Link to="/termos" className={linkClasse}>Termos de Uso</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className={tituloClasse}>Fale com a gente</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`mailto:${CONTATO.email}`} className="flex items-center gap-3 text-white/90 hover:text-white">
                  <span className="rounded-md bg-white/10 p-2"><Mail className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="break-all">{CONTATO.email}</span>
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${CONTATO.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/90 hover:text-white">
                  <span className="rounded-md bg-white/10 p-2"><Phone className="h-4 w-4" aria-hidden="true" /></span>
                  WhatsApp {CONTATO.whatsappTexto}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/70 md:flex-row">
          <p>© {new Date().getFullYear()} Volta Express Brasil. Cadastro gratuito; a negociação do frete é direta entre as partes.</p>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link to="/termos" className="hover:text-white">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
