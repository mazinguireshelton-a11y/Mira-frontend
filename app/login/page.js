"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Logo from "../../components/Logo";

export default function Login() {
  const router = useRouter();
  const [aba, setAba] = useState("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [apelido, setApelido] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [oferta, setOferta] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [msgRecuperar, setMsgRecuperar] = useState("");

  async function handleGoogle() {
    setErro("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setErro(error.message);
  }

  async function handleEntrar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleCriarConta(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }
    if (data.user) {
      await supabase.from("clientes").upsert({
        id: data.user.id,
        email,
        apelido: apelido || email.split("@")[0],
        empresa,
        perfil_oferta: oferta,
        limite_diario: 3,
        plano: "free",
      });
    }
    setCarregando(false);
    setErro("");
    alert("Conta criada! Confirma o link enviado para o teu e-mail antes de entrar.");
    setAba("entrar");
  }

  async function handleRecuperar() {
    setMsgRecuperar("");
    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setMsgRecuperar(error ? error.message : "Se esse e-mail existir, foi enviado um link de recuperação.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} />
        </div>

        {erro && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-md p-3 mb-4">
            {erro}
          </div>
        )}

        <button
          onClick={handleGoogle}
          className="w-full border border-borda bg-bgElevado py-2.5 mb-3 flex items-center justify-center gap-2 hover:border-destaque transition"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-destaque inline-block" />
          Continuar com Google
        </button>

        <div className="text-center text-textoFraco text-sm my-3">ou</div>

        <div className="flex border-b border-borda mb-4">
          <button
            className={`flex-1 pb-2 text-sm ${aba === "entrar" ? "text-destaque border-b-2 border-destaque" : "text-textoFraco"}`}
            onClick={() => setAba("entrar")}
          >
            Entrar
          </button>
          <button
            className={`flex-1 pb-2 text-sm ${aba === "criar" ? "text-destaque border-b-2 border-destaque" : "text-textoFraco"}`}
            onClick={() => setAba("criar")}
          >
            Criar conta
          </button>
        </div>

        {aba === "entrar" && (
          <form onSubmit={handleEntrar} className="space-y-3">
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            <button type="submit" disabled={carregando} className="w-full bg-destaque text-white py-2.5">
              {carregando ? "A entrar..." : "Entrar no Painel"}
            </button>
            <button type="button" onClick={() => setMostrarRecuperar(!mostrarRecuperar)} className="w-full text-sm text-textoFraco border border-borda py-2">
              Esqueci a senha
            </button>
            {mostrarRecuperar && (
              <div className="border border-borda p-3 rounded-md space-y-2">
                <input placeholder="O teu e-mail" value={emailRecuperar} onChange={(e) => setEmailRecuperar(e.target.value)} />
                <button type="button" onClick={handleRecuperar} className="w-full bg-bgElevado border border-borda py-2 text-sm">
                  Enviar link de recuperação
                </button>
                {msgRecuperar && <p className="text-xs text-textoFraco">{msgRecuperar}</p>}
              </div>
            )}
          </form>
        )}

        {aba === "criar" && (
          <form onSubmit={handleCriarConta} className="space-y-3">
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Nome para usar nas propostas" value={apelido} onChange={(e) => setApelido(e.target.value)} />
            <input placeholder="Onde trabalhas / empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            <textarea placeholder="O que fazes / que serviço ofereces" value={oferta} onChange={(e) => setOferta(e.target.value)} rows={3} />
            <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
            <button type="submit" disabled={carregando} className="w-full bg-destaque text-white py-2.5">
              {carregando ? "A criar..." : "Criar Conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
