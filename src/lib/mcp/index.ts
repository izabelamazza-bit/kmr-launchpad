import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLeadsTool from "./tools/list-leads";
import listContractsTool from "./tools/list-contracts";
import listSinistrosTool from "./tools/list-sinistros";
import getContractTool from "./tools/get-contract";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kmr-mcp",
  title: "KMR — Garantia locatícia",
  version: "0.1.0",
  instructions:
    "Ferramentas KMR para consultar leads capturados, contratos do módulo de Auditoria e sinistros (avisos de desocupação). Todas as ações rodam como o usuário conectado, respeitando as permissões da plataforma.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listLeadsTool, listContractsTool, listSinistrosTool, getContractTool],
});