"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

function CallbackConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ehRecuperacao, setEhRecuperacao] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const tipo = params.get("type");
    if (tipo === "recovery") {
      setEhRecuperacao(true);
      return;
    }
    // Login normal (Google ou e-mail): supabase-js já processou a sessão sozinho
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });
  }, [params, router]);

  async function handleDefinirSenha(e) {
    e.preventDefault();
    setErro("");
    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) {
      setErro(error.message);
      return;
    }
    router.replace("/dashboard");
  }

  if (ehRecuperacao) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleDefinirSenha} className="w-full max-w-sm space-y-3">
          <h2 className="text-xl font-bold text-center mb-4">Definir Nova Senha</h2>
          {erro && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-md p-3">{erro}</div>}
          <input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
          <input type="password" placeholder="Confirma a nova senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required />
          <button type="submit" className="w-full bg-destaque text-white py-2.5">Guardar nova senha</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-textoFraco">A entrar...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-textoFraco">A carregar...</p></div>}>
      <CallbackConteudo />
    </Suspense>
  );
}
