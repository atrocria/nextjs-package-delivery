"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Package } from "lucide-react";

import { createClient } from "@/utils/supabase/client";

type RegistrationForm = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

const initialForm: RegistrationForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RegistrationForm, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (form.password.length < 8) {
      setErrorMessage("Your password must contain at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      "Your account has been created. Check your email for the confirmation link before signing in."
    );
    setForm(initialForm);
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
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: "DM Sans", sans-serif;
        }
        .auth-card {
          width: 100%;
          max-width: 480px;
          padding: 8px 0;
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
        .auth-field input,
        .auth-field textarea {
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
          font-family: inherit;
          resize: vertical;
        }
        .auth-field input:focus,
        .auth-field textarea:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(255,145,77,0.12);
        }
        .auth-field small {
          display: block;
          margin-top: 5px;
          font-size: 11px;
          color: var(--muted);
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
        .auth-success {
          background: #edf9ec;
          border: 1px solid #b3e8b0;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: #2e7d32;
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
        .auth-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 480px) {
          .auth-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          <Link href="/" className="auth-logo">plop<span>.</span></Link>

          <div className="auth-icon-banner">
            <Package size={18} />
            Create a free account to send &amp; track parcels
          </div>

          <h1 className="auth-heading">
            Join the <span>plop.</span>
          </h1>
          <p className="auth-subtext">One profile for all your parcel adventures.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
              <div className="auth-field">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="auth-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+60 12 345 6789"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="At least 8 characters"
              />
              <small>At least 8 characters.</small>
            </div>

            <div className="auth-field">
              <label htmlFor="address">Delivery address</label>
              <textarea
                id="address"
                autoComplete="street-address"
                required
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Your default delivery address"
                rows={3}
              />
            </div>

            {errorMessage && (
              <p className="auth-error" role="alert">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="auth-success" role="status">{successMessage}</p>
            )}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : <>Create account <ArrowRight size={17} /></>}
            </button>
          </form>

          <p className="auth-link-row">
            Already have an account?{" "}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
