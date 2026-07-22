"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import styles from "./login.module.css";

function FloralCluster({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={`${styles.floralCluster} ${
        position === "top"
          ? styles.floralClusterTop
          : styles.floralClusterBottom
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 420 360" role="presentation">
        <path
          className={styles.flowerLine}
          d="M48 328C116 262 151 192 165 81M111 318C160 253 210 225 304 207M77 286C135 262 190 269 249 315M151 223C202 160 252 118 355 87"
        />

        <ellipse className={styles.flowerSage} cx="89" cy="273" rx="19" ry="48" transform="rotate(-54 89 273)" />
        <ellipse className={styles.flowerSage} cx="143" cy="250" rx="18" ry="45" transform="rotate(39 143 250)" />
        <ellipse className={styles.flowerSage} cx="212" cy="255" rx="17" ry="42" transform="rotate(-45 212 255)" />
        <ellipse className={styles.flowerSage} cx="276" cy="189" rx="18" ry="44" transform="rotate(52 276 189)" />
        <ellipse className={styles.flowerSage} cx="318" cy="124" rx="17" ry="42" transform="rotate(-58 318 124)" />

        <g transform="translate(122 112)">
          <circle className={styles.flowerBlue} cx="0" cy="0" r="34" />
          <circle className={styles.flowerPale} cx="-28" cy="8" r="25" />
          <circle className={styles.flowerBlue} cx="27" cy="10" r="24" />
          <circle className={styles.flowerPale} cx="0" cy="31" r="25" />
          <circle className={styles.flowerIvory} cx="2" cy="8" r="14" />
        </g>

        <g transform="translate(229 154)">
          <circle className={styles.flowerIvory} cx="0" cy="0" r="31" />
          <circle className={styles.flowerPale} cx="-26" cy="7" r="20" />
          <circle className={styles.flowerIvory} cx="24" cy="8" r="22" />
          <circle className={styles.flowerYellow} cx="1" cy="7" r="10" />
        </g>

        <g transform="translate(325 75)">
          <circle className={styles.flowerYellow} cx="0" cy="0" r="26" />
          <circle className={styles.flowerIvory} cx="-20" cy="9" r="18" />
          <circle className={styles.flowerYellow} cx="22" cy="8" r="17" />
          <circle className={styles.flowerIvory} cx="2" cy="22" r="18" />
        </g>

        <g transform="translate(280 268)">
          <circle className={styles.flowerBlue} cx="0" cy="0" r="30" />
          <circle className={styles.flowerPale} cx="-24" cy="8" r="19" />
          <circle className={styles.flowerBlue} cx="23" cy="8" r="21" />
          <circle className={styles.flowerIvory} cx="1" cy="6" r="9" />
        </g>
      </svg>
    </div>
  );
}

function FloralCrest() {
  return (
    <div className={styles.formFloralCrest} aria-hidden="true">
      <svg viewBox="0 0 180 88" role="presentation">
        <path
          d="M22 70C52 49 67 34 88 15M158 70C127 49 113 34 92 15"
          className={styles.flowerLine}
        />
        <ellipse className={styles.flowerSage} cx="54" cy="48" rx="9" ry="22" transform="rotate(-52 54 48)" />
        <ellipse className={styles.flowerSage} cx="126" cy="48" rx="9" ry="22" transform="rotate(52 126 48)" />
        <circle className={styles.flowerPale} cx="76" cy="28" r="17" />
        <circle className={styles.flowerBlue} cx="91" cy="22" r="19" />
        <circle className={styles.flowerIvory} cx="106" cy="29" r="16" />
        <circle className={styles.flowerYellow} cx="91" cy="23" r="6" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        if (error.code === "email_not_confirmed") {
          setErro("O e-mail desta conta ainda não foi confirmado.");
        } else if (error.code === "invalid_credentials") {
          setErro("E-mail ou senha incorretos. Verifique os dados e tente novamente.");
        } else {
          setErro(`Não foi possível entrar: ${error.message}`);
        }

        setCarregando(false);
        return;
      }

      if (!data.user || !data.session) {
        setErro("O login foi aceito, mas nenhuma sessão foi criada.");
        setCarregando(false);
        return;
      }

      window.location.replace("/painel");
    } catch (error) {
      console.error("Erro inesperado durante o login:", error);
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.brandPanel} aria-label="Apresentação do casamento">
        <FloralCluster position="top" />
        <FloralCluster position="bottom" />

        <div className={styles.invitationCard}>
          <div className={styles.brandContent}>
            <span className={styles.brandEyebrow}>Nosso casamento</span>

            <div className={styles.brandMonogram} aria-hidden="true">
              B&amp;F
            </div>

            <h1>
              Bárbara
              <br />
              &amp; Felipe
            </h1>

            <div className={styles.ornament} aria-hidden="true">
              <span>✦</span>
            </div>

            <p>
              Um espaço reservado para organizar os detalhes, acompanhar os preparativos
              e guardar tudo o que fará parte do nosso grande dia.
            </p>

            <div className={styles.weddingDate}>08 de agosto de 2027</div>
          </div>
        </div>

        <footer className={styles.brandFooter}>
          <span>Planejamento</span>
          <i aria-hidden="true" />
          <span>Convidados</span>
          <i aria-hidden="true" />
          <span>Memórias</span>
        </footer>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileBrand}>
            <span>Nosso casamento</span>
            <strong>Bárbara &amp; Felipe</strong>
          </div>

          <form className={styles.loginForm} onSubmit={fazerLogin}>
            <FloralCrest />

            <header className={styles.formHeader}>
              <div className={styles.monogram} aria-hidden="true">
                B&amp;F
              </div>

              <span className={styles.formEyebrow}>Área reservada</span>

              <h2>Acesso dos noivos</h2>

              <p>
                Entre com seus dados para continuar a organização do casamento.
              </p>

              <div className={styles.formDivider} aria-hidden="true">
                <span>✦</span>
              </div>
            </header>

            <div className={styles.formFields}>
              <label className={styles.field} htmlFor="email">
                <span>E-mail</span>

                <div className={styles.inputWrapper}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5.5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    disabled={carregando}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className={styles.field} htmlFor="senha">
                <div className={styles.fieldHeading}>
                  <span>Senha</span>
                  <Link href="/recuperar-senha">Esqueci minha senha</Link>
                </div>

                <div className={styles.inputWrapper}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    id="senha"
                    name="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={carregando}
                    onChange={(event) => setSenha(event.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className={styles.passwordButton}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={mostrarSenha}
                    disabled={carregando}
                    onClick={() => setMostrarSenha((currentValue) => !currentValue)}
                  >
                    {mostrarSenha ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m3 3 18 18" />
                        <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
                        <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c5.5 0 9 5 9 5a16.7 16.7 0 0 1-2.1 2.6" />
                        <path d="M6.6 6.6C4.4 8 3 10 3 10s3.5 5 9 5a9.7 9.7 0 0 0 3.1-.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            </div>

            {erro && (
              <div className={styles.errorMessage} role="alert" aria-live="polite">
                <span aria-hidden="true">!</span>
                <p>{erro}</p>
              </div>
            )}

            <button type="submit" className={styles.submitButton} disabled={carregando}>
              {carregando && <span className={styles.spinner} aria-hidden="true" />}

              <span>{carregando ? "Entrando..." : "Entrar no painel"}</span>

              {!carregando && (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m14 7 5 5-5 5" />
                </svg>
              )}
            </button>

            <p className={styles.securityMessage}>
              <span aria-hidden="true">✓</span>
              Acesso restrito aos responsáveis pela organização.
            </p>
          </form>

          <footer className={styles.formFooter}>
            <span>Bárbara &amp; Felipe</span>
            <i aria-hidden="true" />
            <span>08 · 08 · 2027</span>
          </footer>
        </div>
      </section>
    </main>
  );
}