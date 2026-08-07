"use client";

import { useEffect, useState } from "react";

export type TurnstileAction = "staff_login" | "participant_login" | "participant_register" | "dashboard_login";

export function useTurnstileGate(storageKey: string, alwaysRequired = false) {
  const [challengeRequired, setChallengeRequiredState] = useState(alwaysRequired);
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedState = window.sessionStorage.getItem(storageKey);
    if (alwaysRequired || (storedState && storedState !== "0")) setChallengeRequiredState(true);
    setReady(true);
  }, [alwaysRequired, storageKey]);

  function resetChallenge() {
    setToken("");
    setWidgetKey((current) => current + 1);
  }

  function setChallengeRequired(required: boolean) {
    setChallengeRequiredState(required);
    if (required) window.sessionStorage.setItem(storageKey, "required");
    else window.sessionStorage.removeItem(storageKey);
  }

  function clearFailedAttempts() {
    setChallengeRequiredState(alwaysRequired);
    setToken("");
    window.sessionStorage.removeItem(storageKey);
  }

  return {
    required: alwaysRequired || challengeRequired,
    ready,
    token,
    widgetKey,
    setToken,
    setChallengeRequired,
    clearFailedAttempts,
    resetChallenge,
  };
}
