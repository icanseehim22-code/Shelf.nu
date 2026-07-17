/**
 * Integração com a API do IXC Provedor (ERP de provedor de internet).
 *
 * FASE 0 da integração: apenas o CLIENTE da API. Nada aqui é chamado pela UI
 * ou pelo banco ainda — é a fundação usada pelas fases seguintes:
 *   - Fase 1: listar as ordens de serviço (OS) do técnico logado (read-only).
 *   - Fase 2: ao baixar material, registrar o consumo numa OS do cliente.
 *
 * Autenticação: Basic com um token no formato "id:chave", gerado no IXC em
 * Sistema > Configurações > aba Integrações. Requisições de leitura exigem o
 * header "ixcsoft: listar" — sem ele a API recusa com "Área restrita".
 *
 * ATENÇÃO: a API do IXC responde HTTP 200 mesmo quando recusa a operação,
 * sinalizando o erro no corpo com { type: "error", message }. Por isso todo
 * retorno é verificado pelo campo `type`, não apenas pelo status HTTP.
 *
 * Variáveis de ambiente (definidas na Vercel, NUNCA no código):
 *   IXC_API_HOST  — ex: https://sistema-ixc.soft.net.br/webservice/v1
 *   IXC_API_TOKEN — token "id:chave" do usuário de integração
 */

/** Um registro genérico do IXC — todos os campos vêm como string. */
export type IxcRegistro = Record<string, string>;

/** Resposta de uma listagem (leitura) do IXC. */
export interface IxcListaResposta<T = IxcRegistro> {
  total: number;
  registros: T[];
}

/** Resposta de uma escrita (insert/update) do IXC. */
interface IxcEscritaResposta {
  type?: "success" | "error";
  message?: string;
  id?: string | number;
}

/**
 * Ordem de serviço do IXC (tabela su_oss_chamado), campos relevantes para o
 * estoque. A API retorna muitos outros; aqui tipamos só o que usamos.
 */
export interface IxcOrdemServico extends IxcRegistro {
  id: string;
  id_cliente: string;
  id_assunto: string;
  id_tecnico: string;
  id_filial: string;
  setor: string;
  status: string;
  mensagem: string;
  data_abertura: string;
  endereco: string;
  bairro: string;
  protocolo: string;
}

/** Dados mínimos para abrir uma OS de consumo de material no cliente. */
export interface NovaOSConsumo {
  idCliente: string;
  idAssunto: string;
  /** Texto do material consumido (ex.: "2x Conector RJ45, 1x ONU"). */
  mensagem: string;
  idFilial?: string;
  setor?: string;
  idTecnico?: string;
}

function getConfig(): { host: string; token: string } {
  const host = process.env.IXC_API_HOST;
  const token = process.env.IXC_API_TOKEN;
  if (!host || !token) {
    throw new Error(
      "Integração IXC não configurada: defina IXC_API_HOST e IXC_API_TOKEN nas variáveis de ambiente.",
    );
  }
  // Remove barras finais para montar a URL de forma previsível.
  return { host: host.replace(/\/+$/, ""), token };
}

function authHeader(token: string): string {
  // Basic <base64("id:chave")>. Buffer é seguro no runtime server (Node).
  return "Basic " + Buffer.from(token).toString("base64");
}

/**
 * Chamada base à API do IXC. Todas as operações passam por aqui.
 *
 * @param recurso   nome da tabela/recurso (ex.: "su_oss_chamado")
 * @param corpo     payload JSON
 * @param modo      "listar" (leitura, adiciona o header ixcsoft) ou "gravar"
 */
async function ixcFetch(
  recurso: string,
  corpo: Record<string, unknown>,
  modo: "listar" | "gravar",
): Promise<unknown> {
  const { host, token } = getConfig();
  const headers: Record<string, string> = {
    Authorization: authHeader(token),
    "Content-Type": "application/json",
  };
  if (modo === "listar") {
    headers["ixcsoft"] = "listar";
  }

  const resp = await fetch(`${host}/${recurso}`, {
    method: "POST",
    headers,
    body: JSON.stringify(corpo),
  });

  const texto = await resp.text();
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(
      `IXC respondeu algo que não é JSON (HTTP ${resp.status}) em ${recurso}: ${texto.slice(0, 200)}`,
    );
  }
  return dados;
}

/**
 * Lista registros de um recurso do IXC com paginação simples.
 * `query`/`oper` filtram por um campo; use `gridParam` para filtros compostos
 * (a API do IXC não suporta OR — filtros extras vão em grid_param).
 */
export async function ixcListar<T = IxcRegistro>(
  recurso: string,
  params: {
    qtype: string;
    query: string;
    oper?: string;
    page?: string;
    rp?: string;
    sortname?: string;
    sortorder?: "asc" | "desc";
    gridParam?: Array<Record<string, string>>;
  },
): Promise<IxcListaResposta<T>> {
  const corpo: Record<string, unknown> = {
    qtype: params.qtype,
    query: params.query,
    oper: params.oper ?? "=",
    page: params.page ?? "1",
    rp: params.rp ?? "100",
    sortname: params.sortname ?? params.qtype,
    sortorder: params.sortorder ?? "asc",
  };
  if (params.gridParam) {
    corpo.grid_param = JSON.stringify(params.gridParam);
  }

  const dados = (await ixcFetch(recurso, corpo, "listar")) as {
    total?: string | number;
    registros?: T[];
  };
  return {
    total: Number(dados.total ?? 0),
    registros: dados.registros ?? [],
  };
}

/**
 * Ordens de serviço de um técnico. Usado na Fase 1 para o técnico ver, no
 * app, as OS atribuídas a ele. `idTecnico` é o id_tecnico do IXC, ligado ao
 * técnico do estoque por um campo manual no perfil.
 */
export async function listarOSDoTecnico(
  idTecnico: string,
  opts: { apenasAbertas?: boolean; rp?: string } = {},
): Promise<IxcOrdemServico[]> {
  const gridParam: Array<Record<string, string>> = [
    { TB: "su_oss_chamado.id_tecnico", OP: "=", P: String(idTecnico) },
  ];
  // status "A" (aberta) / "AG" (agendada) são os relevantes para o técnico em
  // campo; "F" (finalizada) fica de fora quando apenasAbertas.
  if (opts.apenasAbertas) {
    gridParam.push({ TB: "su_oss_chamado.status", OP: "!=", P: "F" });
  }

  const { registros } = await ixcListar<IxcOrdemServico>("su_oss_chamado", {
    qtype: "su_oss_chamado.id",
    query: "",
    oper: ">",
    rp: opts.rp ?? "200",
    sortname: "su_oss_chamado.data_abertura",
    sortorder: "desc",
    gridParam,
  });
  return registros;
}

/**
 * Cria uma OS de consumo de material no cliente (Fase 2). Registra o material
 * como TEXTO na mensagem da OS — não mexe no estoque do IXC (decisão do
 * projeto: o estoque real vive no EstoqueSoftSystem).
 *
 * Lança erro se o IXC recusar (lembrando: ele responde HTTP 200 com
 * { type: "error" }).
 */
export async function criarOSConsumo(os: NovaOSConsumo): Promise<string> {
  const corpo: Record<string, unknown> = {
    id_cliente: os.idCliente,
    id_assunto: os.idAssunto,
    id_filial: os.idFilial ?? "1",
    setor: os.setor ?? "1",
    status: "A",
    prioridade: "N",
    origem_endereco: "C",
    data_abertura: formatarDataHora(new Date()),
    mensagem: os.mensagem,
    ...(os.idTecnico ? { id_tecnico: os.idTecnico } : {}),
  };

  const r = (await ixcFetch("su_oss_chamado", corpo, "gravar")) as IxcEscritaResposta;
  if (r.type !== "success" || !r.id) {
    throw new Error(
      `IXC recusou a criação da OS: ${r.message ?? "sem mensagem"}`,
    );
  }
  return String(r.id);
}

/** Formata Date -> "YYYY-MM-DD HH:mm:ss", que é o esperado pelo IXC. */
function formatarDataHora(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}
