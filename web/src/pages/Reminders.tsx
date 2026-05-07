import { useState } from "react";
import useSWR, { mutate } from "swr";
import type { Reminder } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const KEY = "/api/reminders";

const Reminders = () => {
  const { data } = useSWR<{ reminders: Reminder[] }>(KEY);
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setErr(null);
    try {
      await api(KEY, {
        method: "POST",
        body: JSON.stringify({
          telegramTarget: target.trim(),
          label: label.trim() || null,
          enabled: true,
        }),
      });
      mutate(KEY);
      setTarget("");
      setLabel("");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "failed");
    }
  };

  const reminders = (data?.reminders ?? []).filter((r) => !r.archivedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold">reminders</h1>
        <p className="text-sm text-muted-foreground">
          fires daily at <strong>9:00 IST</strong>. delivers a list of pending posts (today + last 7 days)
          to the chosen telegram target.
        </p>
      </header>

      <section className="rounded-lg border p-3 sm:p-4 bg-muted/30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <Input
            placeholder="@username or chat id"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <Input
            placeholder="label (optional, e.g. 'team standup')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Button onClick={create} disabled={!target.trim()}>+ add</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For <code>@username</code> the recipient must have messaged the bot at least once
          (so we can resolve their chat id). Numeric chat ids work immediately.
        </p>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </section>

      {reminders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          no reminders yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <ReminderRow key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
};

const ReminderRow = ({ r }: { r: Reminder }) => {
  const toggle = async () => {
    await api(`/api/reminders/${r.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !r.enabled }),
    });
    mutate(KEY);
  };
  const remove = async () => {
    if (!confirm("Delete this reminder?")) return;
    await api(`/api/reminders/${r.id}`, { method: "DELETE" });
    mutate(KEY);
  };
  const test = async () => {
    try {
      await api(`/api/reminders/${r.id}/test`, { method: "POST" });
      alert("Sent — check Telegram.");
    } catch (e) {
      alert(e instanceof ApiCallError ? e.message : "failed");
    }
  };
  return (
    <li className="rounded-lg border p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="font-medium truncate">{r.label || r.telegramTarget}</div>
        <div className="text-xs text-muted-foreground truncate">
          → <code>{r.telegramTarget}</code> · daily 9:00 IST · {r.enabled ? "enabled" : "paused"}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="outline" onClick={test}>test</Button>
        <Button size="sm" variant="ghost" onClick={toggle}>
          {r.enabled ? "pause" : "enable"}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove}>delete</Button>
      </div>
    </li>
  );
};

export default Reminders;
