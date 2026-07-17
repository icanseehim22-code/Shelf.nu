import { data, type LoaderFunctionArgs } from "react-router";

import { listarOSDoTecnico } from "~/modules/ixc/ixc.server";
import {
  makeEstoqueSoftSystemError,
  EstoqueSoftSystemError,
} from "~/utils/error";
import { payload, error } from "~/utils/http.server";
import {
  PermissionAction,
  PermissionEntity,
} from "~/utils/permissions/permission.data";
import { requirePermission } from "~/utils/roles.server";

/**
 * API read-only: lista as ordens de serviço (OS) de um técnico no IXC.
 *
 * Parte da Fase 1 da integração IXC. Recebe o `id_tecnico` do IXC via query
 * (?tecnico=123) porque o vínculo persistente técnico↔IXC (um campo no
 * TeamMember) depende de uma migração de banco, aplicada à parte com o passo
 * de RLS do projeto. Esta rota não toca o banco — só lê do IXC.
 *
 * Exemplos:
 *   GET /api/ixc/ordens?tecnico=123
 *   GET /api/ixc/ordens?tecnico=123&apenasAbertas=1
 */
export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    // Exige apenas usuário autenticado da organização (leitura).
    await requirePermission({
      userId,
      request,
      entity: PermissionEntity.asset,
      action: PermissionAction.read,
    });

    const url = new URL(request.url);
    const idTecnico = url.searchParams.get("tecnico");
    const apenasAbertas = url.searchParams.get("apenasAbertas") === "1";

    if (!idTecnico) {
      throw new EstoqueSoftSystemError({
        cause: null,
        status: 400,
        label: "IXC",
        message: "Informe o id do técnico do IXC em ?tecnico=",
        shouldBeCaptured: false,
      });
    }

    const ordensRaw = await listarOSDoTecnico(idTecnico, { apenasAbertas });

    // Expõe só o necessário para a UI, com nomes de campo em camelCase.
    const ordens = ordensRaw.map((os) => ({
      id: os.id,
      protocolo: os.protocolo,
      idCliente: os.id_cliente,
      idAssunto: os.id_assunto,
      status: os.status,
      mensagem: os.mensagem,
      dataAbertura: os.data_abertura,
      endereco: os.endereco,
      bairro: os.bairro,
    }));

    return data(payload({ ordens, total: ordens.length }));
  } catch (cause) {
    const reason = makeEstoqueSoftSystemError(cause, { userId });
    return data(error(reason), { status: reason.status });
  }
}
