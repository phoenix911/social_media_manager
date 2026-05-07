import { useState } from "react";
import { useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Owner, Project } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Owners = () => {
  const { slug } = useParams();
  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const ownersKey = project ? `/api/owners?projectId=${project.id}` : null;
  const { data: oData } = useSWR<{ owners: Owner[] }>(ownersKey);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    if (!project || !name.trim()) return;
    setErr(null);
    try {
      await api("/api/owners", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          name: name.trim(),
          emails: email.trim() ? [email.trim()] : [],
        }),
      });
      mutate(ownersKey);
      setName("");
      setEmail("");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "failed");
    }
  };

  if (!project) return <div className="p-6 text-muted-foreground">loading…</div>;
  const owners = (oData?.owners ?? []).filter((o) => !o.archivedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold">owners</h1>
        <p className="text-sm text-muted-foreground">
          channels are visible only to owners listed here. whoever connects a channel
          becomes its owner automatically — add more emails to share visibility.
        </p>
      </header>

      <section className="rounded-lg border p-3 sm:p-4 bg-muted/30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
          <Input placeholder="owner name (e.g. Sangeet)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Button onClick={create} disabled={!name.trim()}>+ add</Button>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </section>

      {owners.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          no owners yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {owners.map((o) => (
            <OwnerRow key={o.id} owner={o} ownersKey={ownersKey} />
          ))}
        </ul>
      )}
    </div>
  );
};

const OwnerRow = ({ owner, ownersKey }: { owner: Owner; ownersKey: string | null }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(owner.name);
  const [emails, setEmails] = useState(owner.emails.join(", "));

  const save = async () => {
    await api(`/api/owners/${owner.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name,
        emails: emails.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (ownersKey) mutate(ownersKey);
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm(`Archive owner "${owner.name}"?`)) return;
    await api(`/api/owners/${owner.id}`, { method: "DELETE" });
    if (ownersKey) mutate(ownersKey);
  };

  return (
    <li className="rounded-lg border p-3 sm:p-4">
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium">{owner.name}</div>
            {owner.emails.length > 0 ? (
              <div className="text-xs text-muted-foreground mt-0.5 break-all">{owner.emails.join(", ")}</div>
            ) : (
              <div className="text-xs text-muted-foreground italic">no emails — invisible to everyone</div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>edit</Button>
            <Button size="sm" variant="ghost" onClick={remove}>archive</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" />
          <Input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="emails (comma separated)" />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>cancel</Button>
          </div>
        </div>
      )}
    </li>
  );
};

export default Owners;
