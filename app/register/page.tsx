"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
    <section className="mx-auto w-full max-w-lg px-6 py-12 sm:py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-blue-700">
            PACKAGE DELIVERY
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Create your customer account
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Your details are used to create one profile for parcel registration
            and delivery updates.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="fullName">
              Full name
            </label>
            <input
              autoComplete="name"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="fullName"
              onChange={(event) => updateField("fullName", event.target.value)}
              required
              type="text"
              value={form.fullName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="email"
              onChange={(event) => updateField("email", event.target.value)}
              required
              type="email"
              value={form.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="password"
              minLength={8}
              onChange={(event) => updateField("password", event.target.value)}
              required
              type="password"
              value={form.password}
            />
            <p className="mt-1.5 text-xs text-gray-500">At least 8 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="phone">
              Phone number
            </label>
            <input
              autoComplete="tel"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="phone"
              onChange={(event) => updateField("phone", event.target.value)}
              required
              type="tel"
              value={form.phone}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="address">
              Address
            </label>
            <textarea
              autoComplete="street-address"
              className="mt-1.5 min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="address"
              onChange={(event) => updateField("address", event.target.value)}
              required
              value={form.address}
            />
          </div>

          {errorMessage ? (
            <p aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p aria-live="polite" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              {successMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link className="font-semibold text-blue-700 hover:text-blue-800" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
