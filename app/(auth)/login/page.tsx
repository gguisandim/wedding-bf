"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import styles from "./login.module.css";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] =
    useState(false);

  async function fazerLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setCarregando(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      console.log("Resultado do login:", {
        user: data.user,
        session: data.session,
        error,
      });

      if (error) {
        console.error("Erro do Supabase:", {
          code: error.code,
          message: error.message,
          status: error.status,
        });

        if (error.code === "email_not_confirmed") {
          setErro(
            "O e-mail desta conta ainda não foi confirmado.",
          );
        } else if (
          error.code === "invalid_credentials"
        ) {
          setErro(
            "E-mail ou senha incorretos. Verifique os dados e tente novamente.",
          );
        } else {
          setErro(
            `Não foi possível entrar: ${error.message}`,
          );
        }

        setCarregando(false);
        return;
      }

      if (!data.user || !data.session) {
        setErro(
          "O login foi aceito, mas nenhuma sessão foi criada.",
        );

        setCarregando(false);
        return;
      }

      window.location.replace("/painel");
    } catch (error) {
      console.error(
        "Erro inesperado durante o login:",
        error,
      );

      setErro(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );

      setCarregando(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section
        className={styles.brandPanel}
        aria-label="Apresentação do casamento"
      >
        <div
          className={styles.decorativeCircleOne}
          aria-hidden="true"
        />

        <div
          className={styles.decorativeCircleTwo}
          aria-hidden="true"
        />

        <div
          className={styles.botanicalDetail}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className={styles.brandContent}>
          <span className={styles.brandEyebrow}>
            Nosso casamento
          </span>

          <h1>Bárbara &amp; Felipe</h1>

          <p>
            Um espaço reservado para organizar cada
            detalhe, acompanhar decisões e preparar o
            grande dia.
          </p>

          <div className={styles.weddingDate}>
            <span aria-hidden="true" />

            <strong>
              08 de Agosto de 2027
            </strong>

            <span aria-hidden="true" />
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

            <strong>
              Bárbara &amp; Felipe
            </strong>
          </div>

          <form
            className={styles.loginForm}
            onSubmit={fazerLogin}
          >
            <header className={styles.formHeader}>
              <div
                className={styles.monogram}
                aria-hidden="true"
              >
              ❤
              </div>

              <span className={styles.formEyebrow}>
                Área reservada
              </span>

              <h2>Acesso dos noivos</h2>

              <p>
                Entre com seus dados para acessar o
                planejamento do casamento.
              </p>
            </header>

            <div className={styles.formFields}>
              <label
                className={styles.field}
                htmlFor="email"
              >
                <span>E-mail</span>

                <div className={styles.inputWrapper}>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
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
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />
                </div>
              </label>

              <label
                className={styles.field}
                htmlFor="senha"
              >
                <div className={styles.fieldHeading}>
                  <span>Senha</span>

                  <Link href="/recuperar-senha">
                    Esqueci minha senha
                  </Link>
                </div>

                <div className={styles.inputWrapper}>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                    />

                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    id="senha"
                    name="senha"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    value={senha}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={carregando}
                    onChange={(event) =>
                      setSenha(event.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className={
                      styles.passwordButton
                    }
                    aria-label={
                      mostrarSenha
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                    aria-pressed={mostrarSenha}
                    disabled={carregando}
                    onClick={() =>
                      setMostrarSenha(
                        (currentValue) =>
                          !currentValue,
                      )
                    }
                  >
                    {mostrarSenha ? (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="m3 3 18 18" />

                        <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />

                        <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c5.5 0 9 5 9 5a16.7 16.7 0 0 1-2.1 2.6" />

                        <path d="M6.6 6.6C4.4 8 3 10 3 10s3.5 5 9 5a9.7 9.7 0 0 0 3.1-.5" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            </div>

            {erro && (
              <div
                className={styles.errorMessage}
                role="alert"
                aria-live="polite"
              >
                <span aria-hidden="true">
                  !
                </span>

                <p>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={carregando}
            >
              {carregando && (
                <span
                  className={styles.spinner}
                  aria-hidden="true"
                />
              )}

              <span>
                {carregando
                  ? "Entrando..."
                  : "Entrar no painel"}
              </span>

              {!carregando && (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />

                  <path d="m14 7 5 5-5 5" />
                </svg>
              )}
            </button>

            <p className={styles.securityMessage}>
              <span aria-hidden="true">
                ✓
              </span>

              Acesso restrito aos responsáveis pela
              organização.
            </p>
          </form>

          <footer className={styles.formFooter}>
            <span>
              Bárbara &amp; Felipe
            </span>

            <i aria-hidden="true" />

            <span>07 · 08 · 2027</span>
          </footer>
        </div>
      </section>
    </main>
  );
}