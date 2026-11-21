/*
 * Termos.tsx — Termos de Uso da plataforma. Página pública: /termos.
 * Ao alterar o texto, atualize VERSAO_TERMOS em src/lib/privacidade.ts.
 * ATENÇÃO: rascunho preparado pela equipe de produto; deve ser revisado por advogado antes da publicação
 * em produção. Os campos entre colchetes [ ] precisam ser preenchidos com os dados da empresa.
 */
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTATO, VERSAO_TERMOS_TEXTO } from "@/lib/privacidade";

const SECOES = [
  { id: "aceite", titulo: "1. Aceite destes termos" },
  { id: "servico", titulo: "2. O que a Volta Express faz" },
  { id: "conta", titulo: "3. Sua conta" },
  { id: "anuncios", titulo: "4. Anúncios" },
  { id: "negociacao", titulo: "5. Negociação e transporte" },
  { id: "proibido", titulo: "6. O que não é permitido" },
  { id: "responsabilidade", titulo: "7. Limites de responsabilidade" },
  { id: "suspensao", titulo: "8. Suspensão e encerramento" },
  { id: "dados", titulo: "9. Dados pessoais" },
  { id: "gratuidade", titulo: "10. Preço" },
  { id: "alteracoes", titulo: "11. Mudanças nestes termos" },
  { id: "foro", titulo: "12. Lei aplicável e foro" },
  { id: "contato", titulo: "13. Fale com a gente" },
];

const Secao = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const titulo = SECOES.find((s) => s.id === id)?.titulo;
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-bold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
};

const Termos = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main id="conteudo" className="flex-1 bg-muted/30 px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-8 rounded-xl border border-border bg-card p-6 text-[0.95rem] leading-relaxed text-muted-foreground shadow-sm sm:p-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Volta Express Brasil</p>
          <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
          <p>Versão de {VERSAO_TERMOS_TEXTO}.</p>
          <p>
            Estes termos explicam as regras para usar a Volta Express: o que a plataforma faz, o que cabe a você e o que cabe
            a nós. Leia junto com a{" "}
            <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>, que trata dos seus dados.
          </p>
        </header>

        <nav aria-label="Sumário" className="rounded-lg bg-muted/50 p-4">
          <p className="mb-2 font-semibold text-foreground">Sumário</p>
          <ol className="grid gap-1 sm:grid-cols-2">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary underline-offset-2 hover:underline">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Secao id="aceite">
          <p>
            A plataforma Volta Express (voltaexpress.com.br) é oferecida por{" "}
            <strong className="text-foreground">[RAZÃO SOCIAL]</strong>, CNPJ <strong className="text-foreground">[CNPJ]</strong>,
            com sede em <strong className="text-foreground">[ENDEREÇO COMPLETO]</strong>. Ao criar a conta, você declara que leu e
            aceita estes termos. Se não concordar, não use a plataforma.
          </p>
          <p>Para criar uma conta, você precisa ter 18 anos ou mais.</p>
        </Secao>

        <Secao id="servico">
          <p>
            A Volta Express é um espaço de anúncios que conecta quem tem caminhão a quem tem carga, para que o caminhão não volte
            vazio. A plataforma mostra anúncios, sugere combinações pelo match de frete e libera o contato entre as partes.
          </p>
          <p>
            A Volta Express <strong className="text-foreground">não transporta cargas</strong>, não é transportadora, corretora
            nem agente de carga, não emite documentos de transporte e não recebe nem repassa pagamentos de frete.
          </p>
        </Secao>

        <Secao id="conta">
          <ul className="list-disc space-y-1 pl-5">
            <li>Os dados do cadastro (nome, CPF, CNPJ se tiver, e-mail e WhatsApp) precisam ser verdadeiros e estar atualizados.</li>
            <li>A conta é pessoal. Guarde a sua senha e avise a gente se suspeitar que alguém entrou nela.</li>
            <li>Você responde pelo que for feito com a sua conta.</li>
          </ul>
        </Secao>

        <Secao id="anuncios">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Anúncio de caminhão: informe placa, tipo de veículo, carroceria, capacidade, rota e datas reais, e só anuncie veículo
              que você está autorizado a operar.
            </li>
            <li>
              Anúncio de carga: informe descrição, peso, volume, rota e datas reais. Não anuncie carga ilegal, sem nota fiscal
              quando ela for exigida, nem produto que precise de licença que você não tem.
            </li>
            <li>Anúncios vencem na data fim informada. Encerre o anúncio quando o frete for fechado ou deixar de valer.</li>
            <li>O valor de referência por km é só uma referência; o preço do frete é combinado entre as partes.</li>
          </ul>
        </Secao>

        <Secao id="negociacao">
          <p>
            Quando alguém clica em "Tenho interesse", a plataforma libera o contato de WhatsApp do anunciante. A partir daí, a
            negociação é direta entre as partes: preço, prazo, documentos, seguro, carga, descarga e pagamento.
          </p>
          <p>
            Cada parte é responsável por cumprir as regras do transporte rodoviário de cargas que se aplicam a ela, como o registro
            na ANTT (RNTRC), o piso mínimo de frete, os documentos fiscais e de transporte e o seguro obrigatório.
          </p>
        </Secao>

        <Secao id="proibido">
          <ul className="list-disc space-y-1 pl-5">
            <li>Usar dados de outra pessoa ou criar conta falsa.</li>
            <li>Publicar anúncio falso, enganoso ou repetido, ou usar a plataforma para aplicar golpes.</li>
            <li>Copiar em massa anúncios ou contatos, usar robôs ou tentar acessar dados que não são seus.</li>
            <li>Enviar spam, ofender ou ameaçar outros usuários pelo contato obtido na plataforma.</li>
            <li>Anunciar o transporte de qualquer item proibido por lei.</li>
          </ul>
        </Secao>

        <Secao id="responsabilidade">
          <p>
            Fazemos o possível para manter a plataforma no ar e os anúncios corretos, mas não garantimos que haverá carga ou
            caminhão para a sua rota, nem que o frete será fechado.
          </p>
          <p>
            Como não participamos da negociação nem do transporte, não respondemos por atraso, avaria, perda, falta de pagamento ou
            descumprimento do que as partes combinaram entre si. Isso não afasta os direitos que a lei garante a você.
          </p>
        </Secao>

        <Secao id="suspensao">
          <p>
            Podemos remover anúncios e suspender ou encerrar contas que descumpram estes termos ou a lei, avisando o motivo sempre
            que possível. Você pode encerrar a sua conta quando quiser, pelo canal da seção 13.
          </p>
        </Secao>

        <Secao id="dados">
          <p>
            O tratamento dos seus dados pessoais segue a{" "}
            <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link> e a LGPD (Lei nº 13.709/2018).
          </p>
        </Secao>

        <Secao id="gratuidade">
          <p>
            Hoje o cadastro e o uso da plataforma são gratuitos. Se um dia passarmos a cobrar por algum recurso, avisaremos antes, e
            o que é cobrado e quanto custa estará descrito na plataforma.
          </p>
        </Secao>

        <Secao id="alteracoes">
          <p>
            Podemos atualizar estes termos. A versão e a data ficam no topo da página. Se a mudança for relevante, avisaremos na
            plataforma ou por e-mail e, quando necessário, pediremos um novo aceite.
          </p>
        </Secao>

        <Secao id="foro">
          <p>
            Estes termos seguem a lei brasileira. Fica eleito o foro da comarca de <strong className="text-foreground">[COMARCA]</strong>,
            ressalvado o direito do consumidor de propor ação no foro do seu domicílio.
          </p>
        </Secao>

        <Secao id="contato">
          <p>
            E-mail: <a href={`mailto:${CONTATO.email}`} className="text-primary underline">{CONTATO.email}</a>
            <br />
            WhatsApp:{" "}
            <a href={`https://wa.me/${CONTATO.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {CONTATO.whatsappTexto}
            </a>
          </p>
          <p>
            <Link to="/cadastro" className="font-semibold text-primary underline">Voltar ao cadastro</Link>
          </p>
        </Secao>
      </article>
    </main>
    <Footer />
  </div>
);

export default Termos;
