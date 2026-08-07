"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { api } from "../../lib/api";

const STATUS_OPCOES = ["Novo", "Contactado", "Respondeu", "Fechado"];

function diasDesde(dataIso) {
  if (!dataIso) return null;
  const diff = (new Date() - new Date(dataIso)) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

export default function MeusLeads() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [perfilOferta, setPerfilOferta] = useState("");
  const [leads, setLeads] = useState([]);
  const [filtro, setFiltro] = useState(STATUS_OPCOES);
  const [dicas, setDicas] = useState({});
  const [carregandoDica, setCarregandoDica] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);

      const { data: perfil } = await supabase
        .from("clientes")
        .select("perfil_oferta")
        .eq("id", session.user.id)
        .maybeSingle();
      setPerfilOferta(perfil?.perfil_oferta || "");

      const { data } = await supabase
        .from("leads_status")
        .select("*")
        .eq("user_id", session.user.id)
        .order("atualizado_em", { ascending: false });
      setLeads(data || []);
    });
  }, [router]);

  async function mudarStatus(id, status) {
    await supabase.from("leads_status").update({ status, atualizado_em: new Date().toISOString() }).eq("id", id);
    setLeads(leads.map((l) => (l.id === id ? { ...l, status, atualizado_em: new Date().toISOString() } : l)));
  }

  async function pedirDica(lead) {
    setCarregandoDica(lead.id);
    try {
      const resp = await api.dicaLead(lead.nome_empresa, lead.status, diasDesde(lead.atualizado_em), perfilOferta);
      setDicas((prev) => ({ ...prev, [lead.id]: resp.texto }));
    } catch (e) {
      setDicas((prev) => ({ ...prev, [lead.id]: `Erro: ${e.message}` }));
    }
    setCarregandoDica(null);
  }

  function toggleFiltro(status) {
    setFiltro((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  const contagem = STATUS_OPCOES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s).length;
    return acc;
  }, {});

  const leadsFiltrados = leads.filter((l) => filtro.includes(l.status));

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard")} className="text-sm text-textoFraco mb-4">← Voltar</button>
      <h1 className="text-xl font-bold mb-1">📋 Meus Leads</h1>
      <p className="text-textoFraco text-sm mb-4">
        Histórico de todas as empresas que já marcaste com um status — com dicas da IA sobre o que fazer a seguir.
      </p>

      {leads.length === 0 ? (
        <p className="text-textoFraco text-sm">Ainda não marcaste nenhum lead.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STATUS_OPCOES.map((s) => (
              <div key={s} className="border border-borda bg-bgElevado rounded-md p-2 text-center">
                <p className="text-lg font-bold">{contagem[s]}</p>
                <p className="text-xs text-textoFraco">{s}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_OPCOES.map((s) => (
              <button
                key={s}
                onClick={() => toggleFiltro(s)}
                className={`text-xs px-3 py-1 rounded-full border ${
                  filtro.includes(s) ? "border-destaque text-destaque" : "border-borda text-textoFraco"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {leadsFiltrados.map((lead, idx) => {
              const dias = diasDesde(lead.atualizado_em);
              return (
                <div
                  key={lead.id}
                  className="border border-borda bg-bgElevado rounded-md p-4 animate-card"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{lead.nome_empresa}</span>
                    <span className="text-xs text-textoFraco">
                      {dias !== null ? `há ${dias} dia(s)` : ""}
                    </span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <select
                      value={lead.status}
                      onChange={(e) => mudarStatus(lead.id, e.target.value)}
                      className="text-sm w-auto flex-1"
                    >
                      {STATUS_OPCOES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => pedirDica(lead)}
                      disabled={carregandoDica === lead.id}
                      className="text-sm border border-destaque text-destaque px-3 py-1.5 whitespace-nowrap"
                    >
                      {carregandoDica === lead.id ? "..." : "💡 Dica da IA"}
                    </button>
                  </div>

                  {dicas[lead.id] && (
                    <div className="mt-3 bg-bg border border-borda rounded-md p-3 text-sm whitespace-pre-wrap">
                      {dicas[lead.id]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
