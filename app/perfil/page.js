"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [apelido, setApelido] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [oferta, setOferta] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      const { data } = await supabase.from("clientes").select("*").eq("id", session.user.id).single();
      if (data) {
        setApelido(data.apelido || "");
        setEmpresa(data.empresa || "");
        setOferta(data.perfil_oferta || "");
      }
    });
  }, [router]);

  async function guardar() {
    await supabase.from("clientes").update({ apelido, empresa, perfil_oferta: oferta }).eq("id", user.id);
    setMsg("Perfil guardado!");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <button onClick={() => router.push("/dashboard")} className="text-sm text-textoFraco mb-4">← Voltar</button>
      <h1 className="text-xl font-bold mb-4">Perfil Profissional</h1>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-textoFraco">Nome para usar nas propostas</label>
          <input value={apelido} onChange={(e) => setApelido(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-textoFraco">Onde trabalhas / empresa</label>
          <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-textoFraco">O que fazes / que serviço ofereces</label>
          <textarea value={oferta} onChange={(e) => setOferta(e.target.value)} rows={3} />
        </div>
        <button onClick={guardar} className="w-full bg-destaque text-white py-2.5">Guardar perfil</button>
        {msg && <p className="text-sm text-green-400 text-center">{msg}</p>}
      </div>
    </div>
  );
}
