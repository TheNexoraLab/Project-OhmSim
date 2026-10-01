"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { AuthIcon } from "./auth-icons";
import styles from "./auth.module.css";

type View = "signin" | "register" | "forgot";
type FieldName = "fullName" | "email" | "contactNumber" | "password" | "confirmPassword";
type Fields = Record<FieldName, string>;
const emptyFields: Fields = { fullName: "", email: "", contactNumber: "", password: "", confirmPassword: "" };
const headings: Record<View, string> = { signin: "WELCOME BACK", register: "NEW TO OHMSIM", forgot: "ACCOUNT RECOVERY" };
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function validation(view: View, values: Fields): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (!values.email.trim()) errors.email = "Email address is required";
  else if (!emailValid(values.email)) errors.email = "Invalid email format";
  if (view !== "forgot" && !values.password) errors.password = "Password is required";
  if (view === "register") {
    if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name";
    if (!values.contactNumber.trim()) errors.contactNumber = "Contact number is required";
    if (values.password.length < 8) errors.password = "Use at least 8 characters";
    if (!values.confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match";
  }
  return errors;
}

function AuthField({ name, label, placeholder = label, type = "text", value, onChange, onBlur, error, valid, autoComplete, icon }: {
  name: FieldName; label: string; placeholder?: string; type?: string; value: string;
  onChange: (value: string) => void; onBlur: () => void; error?: string; valid?: boolean;
  autoComplete: string; icon: "mail" | "lock" | "user" | "phone";
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className={styles.fieldGroup}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <div className={styles.phoneRow}>
        {name === "contactNumber" && <span className={styles.prefix} id={`${id}-prefix`}>+63</span>}
        <div className={styles.field} data-invalid={Boolean(error)} data-valid={Boolean(valid && !error)}>
          <span className={styles.icon}><AuthIcon name={icon} /></span>
          <input id={id} name={name} type={password && visible ? "text" : type} value={value}
            placeholder={placeholder} autoComplete={autoComplete} required
            inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={[error ? `${id}-error` : "", name === "contactNumber" ? `${id}-prefix` : ""].filter(Boolean).join(" ") || undefined}
            onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
          {password ? <button className={styles.visibility} type="button" aria-label={`${visible ? "Hide" : "Show"} ${name === "confirmPassword" ? "confirm password" : "password"}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
            <AuthIcon name={visible ? "eye" : "hidden"} />
          </button> : valid && !error ? <span className={styles.successIcon}><AuthIcon name="check" /><span className="sr-only">Format accepted</span></span> : null}
        </div>
      </div>
      {error && <p id={`${id}-error`} className={styles.error}>{error}</p>}
    </div>
  );
}

export function AuthExperience() {
  const [view, setView] = useState<View>("signin");
  const [values, setValues] = useState<Fields>(emptyFields);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = validation(view, values);

  function switchView(next: View) {
    setView(next);
    setValues(emptyFields);
    setTouched({});
    setSubmitted(false);
    setNotice("");
    setResetEmail("");
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  // Deliberately local presentation only. Developer 3 will supply real auth later.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setNotice("");
    const firstError = (Object.keys(errors) as FieldName[])[0];
    if (firstError) {
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${firstError}"]`)?.focus();
      return;
    }
    if (view === "forgot") setResetEmail(values.email.trim());
    else setNotice(view === "signin" ? "Sign-in preview complete. No session was created." : "Account preview complete. No account was created.");
    setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
    setTouched({});
    setSubmitted(false);
  }

  function field(name: FieldName, label: string, icon: "mail" | "lock" | "user" | "phone", type: string, autoComplete: string, placeholder?: string) {
    const reviewed = touched[name] || submitted;
    return <AuthField key={`${view}-${name}`} name={name} label={label} placeholder={placeholder} icon={icon} type={type} autoComplete={autoComplete}
      value={values[name]} onChange={(value) => { setValues((current) => ({ ...current, [name]: value })); setNotice(""); }}
      onBlur={() => setTouched((current) => ({ ...current, [name]: true }))}
      error={reviewed ? errors[name] : undefined} valid={view !== "signin" && Boolean(reviewed && values[name] && !errors[name])} />;
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.shell}>
      <svg className={styles.circuits} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <g stroke="var(--mocha-accent)" strokeWidth="1" fill="none">
          <path d="M0 80H120V180M0 260H64V360" /><circle cx="120" cy="80" r="3" /><circle cx="120" cy="180" r="3" /><circle cx="64" cy="360" r="3" />
          <circle cx="200" cy="50" r="2" /><circle cx="350" cy="190" r="1.5" /><circle cx="700" cy="310" r="1.5" />
        </g>
        <g fill="var(--mocha-accent-secondary)"><circle cx="520" cy="95" r="2" opacity=".65" /><circle cx="860" cy="160" r="2" opacity=".55" /></g>
        <svg x="80%" width="20%" height="240" viewBox="0 0 200 240" preserveAspectRatio="none"><path d="M200 100H90V220" stroke="var(--mocha-accent-secondary)" fill="none" /><circle cx="90" cy="100" r="3" fill="none" stroke="var(--mocha-accent-secondary)" /></svg>
      </svg>
      <aside className={styles.artwork} aria-label="OhmSim artwork">
        <Image src="/auth/ohmsim-emblem.png" alt="OhmSim lightning emblem" width={1536} height={1024} className={styles.emblem} priority />
      </aside>
      <section className={styles.formPane} aria-labelledby="auth-heading">
        <div className={styles.content}>
          <div className={styles.heading} data-view={view}>
            <h1 ref={headingRef} id="auth-heading" tabIndex={-1}>{headings[view]}</h1>
            <Link href="/" aria-label="OhmSim — back to landing page" className={styles.brand}>
              <Image src="/logos/ohmsim-logo.png" alt="OhmSim" width={2172} height={724} className={view === "signin" ? styles.wordmarkLarge : styles.wordmark} priority />
            </Link>
            {view === "forgot" && <p className={styles.description}>Enter your email and we&apos;ll send you a reset link.</p>}
          </div>
          <p className={styles.previewNote}>Frontend preview only. No authentication or email delivery. Use sample details.</p>
          {resetEmail ? <Surface className={styles.resetSuccess} role="status">
            <span className={styles.resetIcon}><AuthIcon name="check" /></span>
            <p><strong>Reset link sent!</strong></p>
            <p>Check your inbox at <span className={styles.email}>{resetEmail}</span></p>
            <p className={styles.previewNote}>Prototype state only — no email was sent.</p>
          </Surface> : <form ref={formRef} key={view} noValidate onSubmit={submit} aria-label={`${headings[view]} form`}>
            <div className={styles.fields} data-view={view}>
              {view === "register" && field("fullName", "Full name", "user", "text", "name")}
              {field("email", "Email address", "mail", "email", "email")}
              {view === "register" && field("contactNumber", "Contact number", "phone", "tel", "tel-national", "912 345 6789")}
              {view !== "forgot" && field("password", "Password", "lock", "password", view === "signin" ? "current-password" : "new-password", view === "register" ? "Password (min 8 characters)" : "Password")}
              {view === "register" && field("confirmPassword", "Confirm password", "lock", "password", "new-password")}
            </div>
            <div className={styles.actions}><Button type="submit" variant="raised" size="large" className={styles.submit}>
              {view === "signin" ? "SIGN IN" : view === "register" ? "CREATE ACCOUNT" : "SEND RESET LINK"}
            </Button></div>
          </form>}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <div className={styles.links}>
            {view === "signin" ? <>
              <button type="button" onClick={() => switchView("forgot")}>Forgot Password?</button>
              <p>No account yet? <button type="button" className={styles.secondaryLink} onClick={() => switchView("register")}>Create Account</button></p>
            </> : <button type="button" onClick={() => switchView("signin")}><AuthIcon name="back" />Back to Sign In</button>}
          </div>
        </div>
      </section>
    </main>
  );
}
