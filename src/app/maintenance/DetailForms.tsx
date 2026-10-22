"use client";

import type { ReactNode, FormEvent } from "react";

export default function DetailForms({ children }: { children: ReactNode }) {
  function prepare(event: FormEvent<HTMLDivElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    let input = form.querySelector<HTMLInputElement>('input[name="return_to"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = "return_to";
      form.appendChild(input);
    }
    input.value = window.location.pathname + window.location.search;
  }

  return <div onSubmitCapture={prepare}>{children}</div>;
}
