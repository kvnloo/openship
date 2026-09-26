"use client";

import { Icon as UiIcon } from "@repo/ui/icons";
import { useState, useEffect, useCallback } from "react";
import { wildcardDomainsApi } from "@/lib/api";
import type { WildcardDomain } from "@repo/contracts";
import { useToast } from "@/context/ToastContext";
import { SettingsSection } from "./SettingsSection";

export function WildcardDomainsSetting() {
  const { showToast } = useToast();
  const [domains, setDomains] = useState<WildcardDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      setLoading(true);
      const res = await wildcardDomainsApi.list();
      setDomains(res?.data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    const cleanDomain = newDomain.trim();
    if (!cleanDomain) return;

    setSubmitting(true);
    try {
      await wildcardDomainsApi.create({
        domain: cleanDomain,
        description: newDescription.trim() || undefined,
        isDefault: newIsDefault,
      });
      showToast(`Wildcard domain "${cleanDomain}" registered`, "success", "Wildcard Domains");
      setNewDomain("");
      setNewDescription("");
      setNewIsDefault(false);
      setShowAddForm(false);
      await fetchDomains();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register wildcard domain";
      showToast(msg, "error", "Wildcard Domains");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefault(domain: WildcardDomain) {
    if (domain.isDefault) return;
    setMutatingId(domain.id);
    try {
      await wildcardDomainsApi.setDefault(domain.id);
      showToast(`Set "${domain.displayDomain || domain.domain}" as default`, "success", "Wildcard Domains");
      await fetchDomains();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set default wildcard domain";
      showToast(msg, "error", "Wildcard Domains");
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete(domain: WildcardDomain) {
    if (!confirm(`Are you sure you want to remove wildcard domain "${domain.displayDomain || domain.domain}"?`)) {
      return;
    }
    setMutatingId(domain.id);
    try {
      await wildcardDomainsApi.delete(domain.id);
      showToast(`Wildcard domain removed`, "success", "Wildcard Domains");
      await fetchDomains();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete wildcard domain";
      showToast(msg, "error", "Wildcard Domains");
    } finally {
      setMutatingId(null);
    }
  }

  const addActionButton = (
    <button
      type="button"
      onClick={() => setShowAddForm((v) => !v)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <UiIcon name={showAddForm ? "close" : "plus"} className="size-3.5" />
      {showAddForm ? "Cancel" : "Add Wildcard Domain"}
    </button>
  );

  return (
    <SettingsSection
      icon="globe"
      title="Wildcard Domains"
      description="Manage wildcard apex domains for auto-generating project preview and free subdomains."
      iconBg="bg-emerald-500/10"
      iconColor="text-emerald-500"
      action={addActionButton}
    >
      {/* Informational callout */}
      <div className="mb-4 rounded-xl border border-border/40 bg-muted/30 p-3.5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
        <UiIcon name="info" className="size-4 shrink-0 text-primary mt-0.5" />
        <div>
          When a <strong className="text-foreground font-medium">default wildcard domain</strong> is selected, new projects will automatically receive an auto-generated preview subdomain under it (e.g. <code className="text-[11px] bg-background px-1 py-0.5 rounded border border-border/50">my-app-a1b2c3.apps.example.com</code>).
        </div>
      </div>

      {/* Add Domain Form */}
      {showAddForm && (
        <form onSubmit={handleAddDomain} className="mb-5 p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add New Wildcard Domain</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-wildcard-domain" className="block text-xs font-medium text-foreground mb-1">
                Apex Domain <span className="text-destructive">*</span>
              </label>
              <input
                id="new-wildcard-domain"
                type="text"
                required
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. apps.example.com or *.apps.example.com"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="new-wildcard-desc" className="block text-xs font-medium text-foreground mb-1">
                Description (Optional)
              </label>
              <input
                id="new-wildcard-desc"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Staging apps domain"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none">
              <input
                type="checkbox"
                checked={newIsDefault}
                onChange={(e) => setNewIsDefault(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              Set as default wildcard domain for new projects
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newDomain.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting && <UiIcon name="spinner" className="size-3 animate-spin" />}
                Add Domain
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Domain List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <UiIcon name="spinner" className="size-4 animate-spin" />
          Loading wildcard domains…
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
          <UiIcon name="globe" className="size-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-foreground">No wildcard domains registered yet</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-3">
            Add a wildcard domain so OpenShip can automatically provision preview subdomains for your projects.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <UiIcon name="plus" className="size-3.5" />
            Add First Wildcard Domain
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {domains.map((d) => {
            const isMutating = mutatingId === d.id;
            return (
              <div
                key={d.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  d.isDefault
                    ? "border-primary/40 bg-primary/[0.03] shadow-sm"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    d.isDefault ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <UiIcon name="globe" className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {d.displayDomain || `*.${d.domain}`}
                      </span>
                      {d.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <UiIcon name="check" className="size-2.5" />
                          Default
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{d.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ps-3">
                  {!d.isDefault && (
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => handleSetDefault(d)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title="Make this the default wildcard domain for new projects"
                    >
                      {isMutating ? "Setting…" : "Set as Default"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleDelete(d)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Remove wildcard domain"
                    aria-label="Remove wildcard domain"
                  >
                    <UiIcon name="trash" className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SettingsSection>
  );
}
