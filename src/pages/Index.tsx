/*
 * Index.tsx — Home da plataforma (v3).
 * Tese: frete de retorno (mesma do Hub e da landing). Sem números sem fonte.
 * Estrutura: hero com as duas personas → como funciona → seção ilustrativa (T4.2) → anúncios ativos → chamada final.
 * Animações discretas (só entrada suave), respeitando "reduzir movimento" do sistema (MotionConfig no App).
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Package, ArrowRight, Megaphone, Route as RouteIcon, MessageCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnuncioCard from "@/components/AnuncioCard";
import SecaoIlustrativa from "@/components/home/SecaoIlustrativa";
import { useAuth } from "@/contexts/AuthContext";
import { buscarAnuncios, type AnuncioCompleto } from "@/lib/anuncio-service";
import heroBg from "@/assets/hero-bg.webp";

const entrada = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const PASSOS = [
  {
    icone: Megaphone,
    titulo: "1. Anuncie",
    texto: "Quem tem caminhão publica a rota e a capacidade livre. Quem tem carga informa o trajeto, o peso e o volume.",
  },
  {
    icone: RouteIcon,
    titulo: "2. O match encontra",
    texto: "A plataforma cruza a rota real do caminhão com as cargas no caminho, no sentido e na data certos, e explica cada sugestão.",
  },
  {
    icone: MessageCircle,
    titulo: "3. Converse direto",
    texto: "Em \"Tenho interesse\", o WhatsApp do anunciante abre na hora. O contato só aparece para quem está logado.",
  },
  {
    icone: BarChart3,
    titulo: "4. Feche e acompanhe",
    texto: "No Meu painel você vê quantas vezes apareceu, quem pediu contato e quantos fretes fechou.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<AnuncioCompleto[]>([]);

  useEffect(() => {
    buscarAnuncios()
      .then(setAnuncios)
      .catch(() => setAnuncios([]));
  }, []);

  // Logado: vai direto ao match na aba certa. Visitante: cadastro com a persona já marcada.
  const linkCaminhao = user ? "/matching?aba=carga" : "/cadastro?perfil=caminhao";
  const linkCarga = user ? "/matching?aba=caminhao" : "/cadastro?perfil=carga";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="conteudo" className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[560px] items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroBg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
          </div>
          <div className="container relative z-10 py-16 md:py-20">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
              <p className="mb-5 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
                Frete de retorno
              </p>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-white md:text-6xl">
                O caminhão que voltaria vazio <span className="text-[hsl(var(--brand-amber))]">leva a sua carga.</span>
              </h1>
              <p className="mb-8 max-w-2xl text-lg text-white/85 md:text-xl">
                A Volta Express conecta quem tem caminhão a quem tem carga no mesmo caminho, no sentido e na data certos.
                A negociação é direta, pelo WhatsApp. O cadastro é gratuito.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-12 gap-2 bg-accent text-accent-foreground shadow-elevated hover:bg-accent/90">
                  <Link to={linkCaminhao}>
                    <Truck className="h-5 w-5" aria-hidden="true" />
                    Tenho caminhão · Encontrar carga
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 gap-2 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link to={linkCarga}>
                    <Package className="h-5 w-5" aria-hidden="true" />
                    Tenho carga · Encontrar caminhão
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Como funciona */}
        <section aria-labelledby="titulo-como-funciona" className="bg-background py-16 md:py-20">
          <div className="container">
            <motion.div {...entrada} className="mb-12 text-center">
              <h2 id="titulo-como-funciona" className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Como funciona</h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Quatro passos entre o anúncio e o frete fechado. Funciona igual para quem tem caminhão e para quem tem carga.
              </p>
            </motion.div>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p) => (
                <motion.li key={p.titulo} {...entrada} className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <p.icone className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{p.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Seção ilustrativa (v3, T4.2) */}
        <SecaoIlustrativa linkCaminhao={linkCaminhao} linkCarga={linkCarga} />

        {/* Anúncios ativos (aparece só quando há anúncios) */}
        {anuncios.length > 0 && (
          <section id="oportunidades" aria-labelledby="titulo-oportunidades" className="bg-background py-16 md:py-20">
            <div className="container">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="titulo-oportunidades" className="mb-2 text-3xl font-bold text-foreground">Anúncios ativos agora</h2>
                  <p className="text-muted-foreground">
                    {user ? "Os mais recentes. Para ver só o que combina com a sua rota, use o Match de frete." : "Os mais recentes. Entre para ver o contato e as sugestões para a sua rota."}
                  </p>
                </div>
                <Button asChild variant="outline" className="min-h-11 gap-2">
                  <Link to={user ? "/buscar" : "/login"}>
                    {user ? "Ver todos" : "Entrar"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {anuncios.slice(0, 3).map((anuncio) => (
                  <motion.div key={anuncio.id} {...entrada}>
                    <AnuncioCard anuncio={anuncio} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Chamada final */}
        <section className="py-16 md:py-20">
          <div className="container">
            <div className="rounded-2xl bg-gradient-hero p-8 text-center shadow-elevated md:p-12">
              <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">Cada volta vazia é frete que ficou na estrada.</h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
                Cadastro gratuito. Anuncie a sua rota ou a sua carga e veja as sugestões do match.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-12 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
                  <Link to={linkCaminhao}><Truck className="h-5 w-5" aria-hidden="true" />Tenho caminhão</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 w-full gap-2 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white sm:w-auto">
                  <Link to={linkCarga}><Package className="h-5 w-5" aria-hidden="true" />Tenho carga</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
