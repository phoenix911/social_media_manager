// Passkey + email-OTP sign-in. Used when AUTH_MODE=webauthn.
//
// Flow:
//   1. user types email -> "use passkey"  (calls /webauthn/login/start)
//   2. on first device, fall back to "send code" -> /email-otp/start
//   3. after OTP success, prompt to register a passkey for next time

import { useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiCallError } from "@/lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "otp" | "register-prompt">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const usePasskey = async () => {
    setErr(null); setBusy(true);
    try {
      const opts = await api<any>("/api/auth/webauthn/login/start", {
        method: "POST", body: JSON.stringify({ email }),
      });
      const cred = await startAuthentication({ optionsJSON: opts });
      await api("/api/auth/webauthn/login/finish", {
        method: "POST", body: JSON.stringify({ email, response: cred }),
      });
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  const sendOtp = async () => {
    setErr(null); setBusy(true);
    try {
      await api("/api/auth/email-otp/start", { method: "POST", body: JSON.stringify({ email }) });
      setStage("otp");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setErr(null); setBusy(true);
    try {
      const r = await api<{ hasPasskey: boolean }>("/api/auth/email-otp/finish", {
        method: "POST", body: JSON.stringify({ email, code }),
      });
      if (r.hasPasskey) window.location.href = "/";
      else setStage("register-prompt");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  const registerPasskey = async () => {
    setErr(null); setBusy(true);
    try {
      const opts = await api<any>("/api/auth/webauthn/register/start", { method: "POST" });
      const cred = await startRegistration({ optionsJSON: opts });
      await api("/api/auth/webauthn/register/finish", {
        method: "POST", body: JSON.stringify({ response: cred }),
      });
      window.location.href = "/";
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background text-foreground">
      <div className="w-full max-w-sm space-y-4 rounded-xl border p-6">
        <h1 className="text-xl font-semibold">sign in</h1>

        {stage === "email" && (
          <>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <div className="flex flex-col gap-2">
              <Button onClick={usePasskey} disabled={!email || busy}>use passkey</Button>
              <Button variant="outline" onClick={sendOtp} disabled={!email || busy}>email me a code</Button>
            </div>
          </>
        )}

        {stage === "otp" && (
          <>
            <p className="text-sm text-muted-foreground">we sent a 6-digit code to {email}.</p>
            <Input inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            <Button onClick={verifyOtp} disabled={!code || busy} className="w-full">continue</Button>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setStage("email")}>back</button>
          </>
        )}

        {stage === "register-prompt" && (
          <>
            <p className="text-sm">add a passkey to this device for faster sign-in next time?</p>
            <div className="flex gap-2">
              <Button onClick={registerPasskey} disabled={busy} className="flex-1">add passkey</Button>
              <Button variant="ghost" onClick={() => (window.location.href = "/")}>skip</Button>
            </div>
          </>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
    </div>
  );
};

export default Login;
