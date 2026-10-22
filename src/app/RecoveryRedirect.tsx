
"use client";

import { useEffect } from "react";

export default function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    const hashParams = new URLSearchParams(hash.slice(1));
    const queryParams = new URLSearchParams(search);

    const isRecovery =
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery";

    if (!isRecovery) return;

    const target = new URL(
      "/reset-password",
      window.location.origin
    );

    if (hashParams.get("type") === "recovery") {
      target.hash = hash;
    } else {
      target.search = search;
    }

    // Replace the current history entry.
    window.location.replace(target.toString());
  }, []);

  return null;
}