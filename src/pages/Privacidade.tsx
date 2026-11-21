/*
 * Privacidade.tsx — Política de Privacidade (LGPD, Lei 13.709/2018). Página pública: /privacidade.
 * Ao alterar o texto, atualize VERSAO_POLITICA em src/lib/privacidade.ts.
 * ATENÇÃO: texto inicial preparado pela equipe de produto; deve ser revisado por advogado antes da publicação
 * em produção. Os campos entre colchetes [ ] precisam ser preenchidos com os dados da empresa.
 */
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTATO, VERSAO_POLITICA_TEXTO } from "@/lib/privacidade";

const SECOES = [
  { id: "quem-somos", titulo: "1. Quem é o responsável pelos seus dados" },
  { id: "dados", titulo: "2. Quais dados usamos" },
  { id: "finalidades", titulo: "3. Para que usamos e com qual base legal" },
  { id: "compartilhamento", titulo: "4. Quem vê os seus dados" },
  { id: "internacional", titulo: "5. Armazenamento fora do Brasil" },
  { id: "retencao", titulo: "6. Por quanto tempo guardamos" },
  { id: "direitos", titulo: "7. Seus direitos" },
  { id: "decisoes", titulo: "8. Sugestões automáticas (match)" },
  { id: "seguranca", titulo: "9. Segurança" },
  { id: "cookies", titulo: "10. Cookies e armazenamento no navegador" },
  { id: "menores", titulo: "11. Menores de idade" },
  { id: "alteracoes", titulo: "12. Mudanças nesta política" },
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

const Privacidade = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <main id="conteudo" className="flex-1 bg-muted/30 px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-8 rounded-xl border border-border bg-card p-6 text-[0.95rem] leading-relaxed text-muted-foreground shadow-sm sm:p-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Volta Express Brasil</p>
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p>Versão de {VERSAO_POLITICA_TEXTO}.</p>
          <p>
            A Volta Express conecta quem tem caminhão a quem tem carga, para que o caminhão não volte vazio.
            Para isso, precisamos de alguns dados seus. Aqui explicamos, em linguagem simples, quais dados usamos,
            para quê, com quem compartilhamos e como você exerce os seus direitos, conforme a Lei Geral de
            Proteção de Dados (LGPD — Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
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

        <Secao id="quem-somos">
          <p>
            O controlador dos dados é <strong className="text-foreground">[RAZÃO SOCIAL]</strong>, inscrita no CNPJ
            sob o nº <strong className="text-foreground">[CNPJ]</strong>, com sede em <strong className="text-foreground">[ENDEREÇO COMPLETO]</strong>,
            responsável pela plataforma Volta Express (voltaexpress.com.br) e pelo site voltaexpressbrasil.com.br.
          </p>
          <p>
            O canal do Encarregado pelo tratamento de dados pessoais (art. 41 da LGPD) é o e-mail{" "}
            <a href={`mailto:${CONTATO.email}`} className="text-primary underline">{CONTATO.email}</a>.
          </p>
        </Secao>

        <Secao id="dados">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Cadastro:</strong> nome do responsável, CPF, CNPJ (opcional), e-mail, WhatsApp, perfil de uso ("Tenho caminhão" ou "Tenho carga") e senha. A senha é guardada pelo provedor de autenticação de forma criptografada; nós não temos acesso a ela.</li>
            <li><strong className="text-foreground">Foto de perfil</strong>, se você enviar.</li>
            <li><strong className="text-foreground">Anúncios:</strong> placa, tipo, capacidade e carroceria do veículo; descrição, categoria, peso e volume da carga; cidades de origem e destino, datas, valor e a rota calculada.</li>
            <li><strong className="text-foreground">Uso da plataforma:</strong> quando um anúncio aparece numa sugestão, quando alguém clica em "Tenho interesse" e quando um frete é informado como fechado, com data e hora.</li>
            <li><strong className="text-foreground">Registro do aceite</strong> desta política: data, hora e versão aceita.</li>
            <li><strong className="text-foreground">Dados técnicos:</strong> endereço IP, data e hora de acesso, tipo de navegador e dispositivo, registrados pelos nossos provedores de hospedagem e banco de dados.</li>
            <li><strong className="text-foreground">Localização:</strong> só quando você toca em "Marcar minha posição" no mapa. Ela é usada na hora, no seu navegador, e não é gravada.</li>
          </ul>
          <p>Não pedimos dados sensíveis (art. 5º, II, da LGPD), como origem racial, saúde, religião ou biometria.</p>
        </Secao>

        <Secao id="finalidades">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th className="py-2 pr-3">Para quê</th>
                  <th className="py-2 pr-3">Dados</th>
                  <th className="py-2">Base legal (LGPD, art. 7º)</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-border"><td className="py-2 pr-3">Criar e manter sua conta</td><td className="py-2 pr-3">Cadastro</td><td className="py-2">Execução de contrato (V)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Publicar anúncios e sugerir cargas ou caminhões compatíveis (match)</td><td className="py-2 pr-3">Anúncios</td><td className="py-2">Execução de contrato (V)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Colocar você em contato com o anunciante pelo WhatsApp</td><td className="py-2 pr-3">Nome, WhatsApp</td><td className="py-2">Execução de contrato (V)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Evitar contas duplicadas e fraudes; identificar quem anuncia</td><td className="py-2 pr-3">CPF, CNPJ, dados técnicos</td><td className="py-2">Legítimo interesse (IX)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Mostrar seus indicadores no "Meu painel" e melhorar o match</td><td className="py-2 pr-3">Uso da plataforma</td><td className="py-2">Execução de contrato (V) e legítimo interesse (IX)</td></tr>
                <tr className="border-b border-border"><td className="py-2 pr-3">Produzir estatísticas agregadas e anônimas sobre o mercado de frete</td><td className="py-2 pr-3">Uso da plataforma, anúncios (sem identificação)</td><td className="py-2">Legítimo interesse (IX)</td></tr>
                <tr><td className="py-2 pr-3">Guardar registros de acesso pelo prazo da lei</td><td className="py-2 pr-3">Dados técnicos</td><td className="py-2">Cumprimento de obrigação legal (II) — Marco Civil, art. 15</td></tr>
              </tbody>
            </table>
          </div>
          <p>Não vendemos dados pessoais. Não enviamos propaganda sem o seu consentimento.</p>
        </Secao>

        <Secao id="compartilhamento">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Outros usuários logados</strong> veem seus anúncios ativos, com seu nome e foto.</li>
            <li><strong className="text-foreground">Seu WhatsApp</strong> só é mostrado ao usuário que clicar em "Tenho interesse" num anúncio seu, e esse clique fica registrado.</li>
            <li><strong className="text-foreground">CPF e CNPJ nunca são mostrados</strong> a outros usuários.</li>
            <li><strong className="text-foreground">Visitantes sem login</strong> veem apenas informações gerais dos anúncios (rota, tipo de carga ou veículo, datas), sem nome nem contato.</li>
            <li>
              <strong className="text-foreground">Prestadores de serviço (operadores)</strong> que tratam dados em nosso nome, sob contrato:
              Supabase (banco de dados, autenticação e armazenamento de fotos), Netlify (hospedagem do site) e
              Google (cálculo de rotas e mapas, que recebe as cidades de origem e destino).
            </li>
            <li>
              <strong className="text-foreground">WhatsApp (Meta):</strong> quando você abre uma conversa, ela acontece no WhatsApp e segue a política dele.
              A negociação do frete é feita diretamente entre as partes.
            </li>
            <li><strong className="text-foreground">Autoridades públicas</strong>, quando houver ordem judicial ou obrigação legal.</li>
          </ul>
        </Secao>

        <Secao id="internacional">
          <p>
            Alguns provedores (Supabase, Netlify e Google) podem armazenar ou processar dados em servidores fora do Brasil.
            Essas transferências seguem o art. 33 da LGPD, com provedores que adotam cláusulas contratuais e medidas de
            segurança compatíveis com a lei brasileira.
          </p>
        </Secao>

        <Secao id="retencao">
          <ul className="list-disc space-y-2 pl-5">
            <li>Dados da conta e anúncios: enquanto a conta estiver ativa. Se você pedir a exclusão, apagamos ou anonimizamos em até 15 dias, salvo o que a lei obrigar a guardar.</li>
            <li>Registros de acesso: 6 meses, como exige o Marco Civil da Internet (art. 15).</li>
            <li>Registro do aceite desta política e eventos de uso: enquanto a conta existir e, depois, pelo prazo necessário para o exercício de direitos em processo judicial ou administrativo.</li>
            <li>Estatísticas agregadas e anônimas podem ser mantidas sem prazo, porque não identificam ninguém.</li>
          </ul>
        </Secao>

        <Secao id="direitos">
          <p>Pelo art. 18 da LGPD, você pode, a qualquer momento e de graça:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>confirmar se tratamos dados seus e acessar esses dados;</li>
            <li>corrigir dados incompletos, inexatos ou desatualizados (vários pela própria tela "Perfil");</li>
            <li>pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
            <li>pedir a portabilidade dos seus dados;</li>
            <li>saber com quem compartilhamos seus dados;</li>
            <li>pedir a exclusão da conta e dos dados tratados com base no consentimento, e revogar o consentimento;</li>
            <li>se opor a um tratamento feito com base no legítimo interesse;</li>
            <li>pedir revisão de decisões tomadas apenas por meios automatizados (art. 20).</li>
          </ul>
          <p>
            Para exercer qualquer direito, escreva para{" "}
            <a href={`mailto:${CONTATO.email}`} className="text-primary underline">{CONTATO.email}</a>.
            Podemos pedir uma confirmação de identidade para proteger a sua conta. Respondemos em até 15 dias.
            Você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </Secao>

        <Secao id="decisoes">
          <p>
            O match ordena as sugestões com uma nota de 0 a 100, calculada a partir de critérios objetivos: desvio da rota,
            aproveitamento do trajeto, proximidade de datas, uso da capacidade, valor por quilômetro e perfil do anunciante.
            A nota só organiza a lista: não aprova, não recusa e não fecha nenhum frete. A decisão de negociar é sempre de vocês.
            Se quiser entender ou contestar uma sugestão, fale com a gente.
          </p>
        </Secao>

        <Secao id="seguranca">
          <p>
            Usamos conexão criptografada (HTTPS), controle de acesso no banco de dados para que cada usuário veja só o que pode ver,
            senhas guardadas de forma criptografada pelo provedor de autenticação e registro dos acessos ao contato dos anunciantes.
            Se houver um incidente de segurança que possa causar risco ou dano relevante, avisaremos você e a ANPD, como manda o art. 48 da LGPD.
          </p>
        </Secao>

        <Secao id="cookies">
          <p>
            Guardamos no seu navegador apenas o que é necessário para manter você logado. Não usamos cookies de publicidade.
            Se um dia passarmos a usar ferramentas de medição ou publicidade, esta política será atualizada e, quando a lei exigir,
            pediremos o seu consentimento antes.
          </p>
        </Secao>

        <Secao id="menores">
          <p>A Volta Express é destinada a maiores de 18 anos. Não coletamos, de forma intencional, dados de crianças e adolescentes.</p>
        </Secao>

        <Secao id="alteracoes">
          <p>
            Podemos atualizar esta política. A versão e a data ficam no topo da página. Se a mudança for relevante, avisaremos na
            plataforma ou por e-mail e, quando necessário, pediremos um novo aceite.
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

export default Privacidade;
