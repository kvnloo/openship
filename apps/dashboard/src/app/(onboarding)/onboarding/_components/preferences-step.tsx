"use client";

import { Icon as UiIcon, type IconName } from "@repo/ui/icons";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { BuildMode } from "@repo/onboarding";
import type { StepProps } from "./step-props";

type PrefOption = {
  id: BuildMode;
  title: string;
  desc: string;
  icon: IconName;
};

export function PreferencesStep({ state, onUpdate, onNext, onBack }: StepProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<BuildMode>(state.buildMode);
  const [wildcardDomain, setWildcardDomain] = useState(state.wildcardDomain ?? "");
  const [openshipDomain, setOpenshipDomain] = useState(state.openshipDomain ?? "");

  const OPTIONS: PrefOption[] = [
    { id: "auto", title: t.onboarding.preferences.options.auto.title, desc: t.onboarding.preferences.options.auto.desc, icon: "sparkles" },
    { id: "server", title: t.onboarding.preferences.options.server.title, desc: t.onboarding.preferences.options.server.desc, icon: "cloud" },
    { id: "local", title: t.onboarding.preferences.options.local.title, desc: t.onboarding.preferences.options.local.desc, icon: "monitor" },
  ];

  function handleContinue() {
    onUpdate({
      buildMode: selected,
      wildcardDomain: wildcardDomain.trim() || undefined,
      openshipDomain: openshipDomain.trim() || undefined,
    });
    onNext();
  }

  return (
    <div className="ob-screen">
      <div className="ob-screen-inner">
        {onBack && (
          <button className="ob-btn-back" aria-label={t.onboarding.common.goBack} onClick={onBack}>
            <UiIcon name="arrow-left" size={18} className="rtl:rotate-180" />
          </button>
        )}

        <div className="ob-card-icon ob-card-icon--center">
          <UiIcon name="settings" size={24} />
        </div>

        <h2>{t.onboarding.preferences.title}</h2>
        <p className="ob-subtitle">
          {t.onboarding.preferences.subtitleLine1}<br/>
          {t.onboarding.preferences.subtitleLine2}
        </p>

        <div className="ob-pref-cards">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = selected === opt.id;
            return (
              <button
                key={opt.id}
                className={`ob-pref-card${isActive ? " active" : ""}`}
                onClick={() => setSelected(opt.id)}
              >
                <div className="ob-pref-card-icon"><UiIcon name={Icon} size={20} /></div>
                <div className="ob-pref-card-content">
                  <span className="ob-pref-card-title">{opt.title}</span>
                  <span className="ob-pref-card-desc">{opt.desc}</span>
                </div>
                <div className="ob-pref-card-check">
                  <UiIcon name="check" size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 my-6 text-start">
          <div className="ob-form-group">
            <label htmlFor="ob-wildcard-domain" className="flex items-center justify-between">
              <span>Wildcard Domain</span>
              <span className="text-xs text-muted-foreground font-normal">Optional</span>
            </label>
            <input
              id="ob-wildcard-domain"
              type="text"
              value={wildcardDomain}
              onChange={(e) => setWildcardDomain(e.target.value)}
              placeholder="e.g. apps.example.com or *.apps.example.com"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Base domain for automatically generating project preview and free URLs (e.g. project.apps.example.com).
            </p>
          </div>

          <div className="ob-form-group">
            <label htmlFor="ob-openship-domain" className="flex items-center justify-between">
              <span>OpenShip Domain</span>
              <span className="text-xs text-muted-foreground font-normal">Optional</span>
            </label>
            <input
              id="ob-openship-domain"
              type="text"
              value={openshipDomain}
              onChange={(e) => setOpenshipDomain(e.target.value)}
              placeholder="e.g. openship.example.com"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Custom domain to access this OpenShip instance dashboard.
            </p>
          </div>
        </div>

        <p className="ob-pref-hint">
          {t.onboarding.preferences.hint}
        </p>

        <button className="ob-btn-primary" onClick={handleContinue}>
          {t.onboarding.common.continue}
        </button>
      </div>
    </div>
  );
}
