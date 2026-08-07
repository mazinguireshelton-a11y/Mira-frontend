"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";
import Logo from "../../components/Logo";

function temperatura(score) {
  if (score >= 40) return { label: "Quente", cor: "text-red-400" };
  if (score >= 15) return { label: "Morno", cor: "text-yellow-400" };
  return { label: "Frio", cor: "text-blue-400" };
}

function extrairMensagem(analise) {
  if (!analise) return "";
  const match = analise.match(/MENSAGEM:?\s*([\s\S]*)/i);
  return match ? match[1].trim() : analise;
}

function baixarCSV(leads, nicho, regiao) {
  const colunas = ["Score", "Nome", "Telefone", "Email", "Site", "Avaliação", "Fonte"];
  const linhas = leads.map((l) =>
    [l.score, l.nome, l.telefone, l.email, l.site, l.avaliacao, l.fonte]
      .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [colunas.join(","), ...linhas].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_${nicho}_${regiao}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [nicho, setNicho] = useState("");
  const [regiao, setRegiao] = useState("");
  const [maxLeads, setMaxLeads] = useState(6);
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [statusPorNome, setStatusPorNome] = useState({});
  const [exportando, setExportando] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      const { data } = await supabase.from("clientes").select("*").eq("id", session.user.id).single();
      setPerfil(data);
    });
  }, [router]);

  async function handleSair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleBuscar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resp = await api.buscar(nicho, regiao, maxLeads);
      setLeads(resp.leads.map((l) => ({ ...l, analise: null })));
    } catch (err) {
      setErro(err.message);
    }
    setCarregando(false);
  }

  async function gerarProposta(idx) {
    const lead = leads[idx];
    try {
      const resp = await api.gerarProposta(
        { ...lead, nicho },
        objetivo || perfil?.perfil_oferta || "",
        perfil?.apelido || user?.email?.split("@")[0]
      );
      const novos = [...leads];
      novos[idx].analise = resp.texto;
      setLeads(novos);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function mudarStatus(nome, status) {
    setStatusPorNome({ ...statusPorNome, [nome]: status });
    await supabase.from("leads_status").upsert(
      { user_id: user.id, nome_empresa: nome, status, atualizado_em: new Date().toISOString() },
      { onConflict: "user_id,nome_empresa" }
    );
  }

  async function exportar(tipo) {
    setExportando(tipo);
    try {
      if (tipo === "csv") {
        baixarCSV(leads, nicho, regiao);
      } else if (tipo === "word") {
        await api.exportarArquivo("/api/export/word", leads, nicho, regiao, `leads_${nicho}_${regiao}.docx`);
      } else if (tipo === "pdf") {
        await api.exportarArquivo("/api/export/pdf", leads, nicho, regiao, `leads_${nicho}_${regiao}.pdf`);
      }
    } catch (err) {
      setErro(err.message);
    }
    setExportando("");
  }

  const kpiEncontrados = leads.length;
  const kpiQuentes = leads.filter((l) => l.score >= 40).length;
  const kpiComEmail = leads.filter((l) => l.email).length;

  const ehPremium = perfil?.plano === "premium";

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Logo size={32} />
          <p className="text-textoFraco text-sm mt-1">Encontra os clientes certos, sem perder tempo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/perfil")} className="border border-borda px-3 py-1.5 text-sm">
            👤 {perfil?.apelido || "Perfil"}
          </button>
          <button onClick={() => router.push("/leads")} className="border border-borda px-3 py-1.5 text-sm">
            📋 Meus Leads
          </button>
          <button onClick={handleSair} className="border border-borda px-3 py-1.5 text-sm">
            Sair
          </button>
        </div>
      </div>

      {!ehPremium && (
        <p className="text-xs text-textoFraco mb-4">
          🆓 Plano Grátis: 3 buscas/dia · até 6 empresas por busca · 1 uso da IA.
        </p>
      )}

      {erro && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-md p-3 mb-4">{erro}</div>}

      <form onSubmit={handleBuscar} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <input placeholder="Nicho / Setor" value={nicho} onChange={(e) => setNicho(e.target.value)} required />
        <input placeholder="Região" value={regiao} onChange={(e) => setRegiao(e.target.value)} required />
        <input type="number" min={1} max={ehPremium ? 50 : 6} value={maxLeads} onChange={(e) => setMaxLeads(Number(e.target.value))} />
        <button type="submit" disabled={carregando} className="bg-destaque text-white py-2 sm:col-span-1">
          {carregando ? "A buscar..." : "Buscar"}
        </button>
      </form>

      {leads.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="border border-borda bg-bgElevado rounded-md p-3 text-center">
              <p className="text-lg font-bold">{kpiEncontrados}</p>
              <p className="text-xs text-textoFraco">Encontrados</p>
            </div>
            <div className="border border-borda bg-bgElevado rounded-md p-3 text-center">
              <p className="text-lg font-bold text-red-400">{kpiQuentes}</p>
              <p className="text-xs text-textoFraco">Quentes</p>
            </div>
            <div className="border border-borda bg-bgElevado rounded-md p-3 text-center">
              <p className="text-lg font-bold">{kpiComEmail}</p>
              <p className="text-xs text-textoFraco">Com E-mail</p>
            </div>
          </div>

          <div className="overflow-x-auto mb-4 border border-borda rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bgElevado text-left text-textoFraco">
                  <th className="p-2">Score</th>
                  <th className="p-2">Nome</th>
                  <th className="p-2">Telefone</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Site</th>
                  <th className="p-2">Avaliação</th>
                  <th className="p-2">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr key={idx} className="border-t border-borda">
                    <td className="p-2">{lead.score}</td>
                    <td className="p-2">{lead.nome}</td>
                    <td className="p-2">{lead.telefone || "-"}</td>
                    <td className="p-2">{lead.email || "-"}</td>
                    <td className="p-2 truncate max-w-[120px]">{lead.site || "-"}</td>
                    <td className="p-2">{lead.avaliacao || "-"}</td>
                    <td className="p-2">{lead.fonte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <button onClick={() => exportar("csv")} disabled={exportando} className="border border-borda text-sm py-2">
              {exportando === "csv" ? "..." : "⬇ Excel (CSV)"}
            </button>
            <button onClick={() => exportar("word")} disabled={exportando} className="border border-borda text-sm py-2">
              {exportando === "word" ? "..." : "⬇ Word"}
            </button>
            <button onClick={() => exportar("pdf")} disabled={exportando} className="border border-borda text-sm py-2">
              {exportando === "pdf" ? "..." : "⬇ PDF"}
            </button>
          </div>

          <div className="mb-4">
            <textarea
              placeholder={`Objetivo específico (opcional). Em branco usa o teu perfil: "${perfil?.perfil_oferta || ""}"`}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            {leads.map((lead, idx) => {
              const temp = temperatura(lead.score);
              return (
                <div
                  key={idx}
                  className="border border-borda bg-bgElevado rounded-md p-4 animate-card"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{lead.nome}</p>
                      <p className="text-sm text-textoFraco">
                        {lead.telefone || "sem telefone"} · {lead.email || "sem e-mail"} · {lead.fonte}
                      </p>
                    </div>
                    <span className={`text-sm font-medium ${temp.cor}`}>{temp.label}</span>
                  </div>

                  {lead.analise && (
                    <div className="mt-3 bg-bg border border-borda rounded-md p-3 text-sm whitespace-pre-wrap">
                      {lead.analise}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => gerarProposta(idx)} className="text-sm border border-destaque text-destaque px-3 py-1.5">
                      Gerar Proposta IA
                    </button>
                    {lead.telefone && (
                      <a
                        href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(extrairMensagem(lead.analise) || "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm border border-borda px-3 py-1.5"
                      >
                        Abrir WhatsApp
                      </a>
                    )}
                    <select
                      value={statusPorNome[lead.nome] || "Novo"}
                      onChange={(e) => mudarStatus(lead.nome, e.target.value)}
                      className="text-sm py-1.5"
                    >
                      <option>Novo</option>
                      <option>Contactado</option>
                      <option>Respondeu</option>
                      <option>Fechado</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
