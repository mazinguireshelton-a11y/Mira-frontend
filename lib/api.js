import { supabase } from "./supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function chamarBackend(caminho, opcoes = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const resp = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(opcoes.headers || {}),
    },
  });

  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(dados.detail || `Erro ${resp.status}`);
  }
  return dados;
}

export const api = {
  buscar: (nicho, regiao, max_leads) =>
    chamarBackend("/api/search", {
      method: "POST",
      body: JSON.stringify({ nicho, regiao, max_leads }),
    }),

  gerarProposta: (lead, objetivo, remetente_nome) =>
    chamarBackend("/api/gerar-proposta", {
      method: "POST",
      body: JSON.stringify({
        nome: lead.nome,
        nicho: lead.nicho || "",
        site: lead.site || "",
        avaliacao: lead.avaliacao || "",
        objetivo,
        remetente_nome,
        telefone: lead.telefone || "",
        email: lead.email || "",
      }),
    }),

  dicaLead: (nome_empresa, status, dias, perfil_oferta) =>
    chamarBackend("/api/dica-lead", {
      method: "POST",
      body: JSON.stringify({ nome_empresa, status, dias, perfil_oferta }),
    }),

  enviarEmail: (remetente, senha_app, destinatario, assunto, corpo) =>
    chamarBackend("/api/enviar-email", {
      method: "POST",
      body: JSON.stringify({ remetente, senha_app, destinatario, assunto, corpo }),
    }),

  exportarArquivo: async (caminho, leads, nicho, regiao, nomeArquivo) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const resp = await fetch(`${API_URL}${caminho}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ leads, nicho, regiao }),
    });

    if (!resp.ok) {
      const dados = await resp.json().catch(() => ({}));
      throw new Error(dados.detail || `Erro ${resp.status}`);
    }

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
