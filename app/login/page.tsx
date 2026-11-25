"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";

import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    let error;
    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      error = result.error;
    } catch (caughtError) {
      error =
        caughtError instanceof Error
          ? caughtError
          : new Error("Unable to connect to Supabase.");
    }

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const nextPath =
      requestedPath?.startsWith("/") &&
      !requestedPath.startsWith("//") &&
      !requestedPath.includes("\\")
        ? requestedPath
        : "/dashboard";
    router.push(nextPath);
  }

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap");
        :root {
          --cream: #fff9ef;
          --orange: #ff914d;
          --dark: #292923;
          --muted: #77746c;
        }
        .auth-page {
          min-height: calc(100vh - var(--navbar-height, 76px));
          min-height: calc(100dvh - var(--navbar-height, 76px));
          box-sizing: border-box;
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: "DM Sans", sans-serif;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
        }
        .auth-logo {
          font-family: "Fredoka", sans-serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -2px;
          color: var(--dark);
          text-decoration: none;
          display: inline-block;
          margin-bottom: 32px;
        }
        .auth-logo span { color: var(--orange); }
        .auth-heading {
          font-family: "Fredoka", sans-serif;
          font-size: 36px;
          font-weight: 600;
          letter-spacing: -1.5px;
          color: var(--dark);
          margin: 0 0 8px;
          line-height: 1.1;
        }
        .auth-heading span { color: var(--orange); }
        .auth-subtext {
          color: var(--muted);
          font-size: 14px;
          margin: 0 0 36px;
          line-height: 1.6;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .auth-field label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #55524b;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .auth-field input {
          width: 100%;
          border: 1.5px solid #e4dfd5;
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 14px;
          color: var(--dark);
          background: white;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .auth-field input:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(255,145,77,0.12);
        }
        .auth-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          border-radius: 50px;
          background: var(--orange);
          color: white;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 8px 22px rgba(255,145,77,0.3);
          margin-top: 4px;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255,145,77,0.38);
        }
        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-error {
          background: #fff0ee;
          border: 1px solid #fcc;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: #c0392b;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0;
          color: #ccc;
          font-size: 12px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e4dfd5;
        }
        .auth-link-row {
          text-align: center;
          font-size: 13px;
          color: var(--muted);
          margin-top: 24px;
        }
        .auth-link {
          color: var(--orange);
          font-weight: 700;
          text-decoration: none;
        }
        .auth-link:hover { text-decoration: underline; }
        .auth-icon-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff4eb;
          border: 1px solid #ffdfc7;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 13px;
          color: #9b5522;
          margin-bottom: 28px;
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          <Link href="/" className="auth-logo">plop<span>.</span></Link>

          <div className="auth-icon-banner">
            <Package size={18} />
            Sign in to track &amp; manage your parcels
          </div>

          <h1 className="auth-heading">
            Welcome <span>back.</span>
          </h1>
          <p className="auth-subtext">Your parcels are waiting. Let&apos;s get you in.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {errorMessage && (
              <p className="auth-error" role="alert">{errorMessage}</p>
            )}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-link-row">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-link">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
