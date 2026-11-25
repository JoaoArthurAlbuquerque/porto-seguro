/**
 * Módulo de Animações, Contadores Progressivos e Notificações
 * Porto Seguro · Gestão Ocupacional
 */

import { esc } from "./state.js";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const valoresAtuais = new WeakMap();

/**
 * Anima suavemente um número inteiro até o valor alvo (com suporte a sufixo como "%")
 */
export function animarContador(el, alvo, { sufixo = "", duracao = 480 } = {}) {
  if (!el) return;
  const destino = Number(alvo) || 0;
  const anterior = valoresAtuais.get(el);

  if (prefersReducedMotion() || anterior === destino) {
    el.textContent = `${destino}${sufixo}`;
    valoresAtuais.set(el, destino);
    return;
  }

  const inicio = typeof anterior === "number" ? anterior : 0;
  valoresAtuais.set(el, destino);
  const t0 = performance.now();

  function step(agora) {
    const progresso = Math.min(1, (agora - t0) / duracao);
    const eased = 1 - Math.pow(1 - progresso, 3);
    const atual = Math.round(inicio + (destino - inicio) * eased);
    el.textContent = `${atual}${sufixo}`;
    if (progresso < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

/**
 * Exibe toast acessível na base da tela
 */
export function toast(msg, tipo = "ok") {
  document.querySelector(".toast")?.remove();
  const corIcone =
    tipo === "err" ? "#f43f5e" : tipo === "warn" ? "#f59e0b" : "#22c55e";
  const icone =
    tipo === "err"
      ? `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
      : `<polyline points="20 6 9 17 4 12"/>`;

  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  t.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${corIcone}" stroke-width="2.6" aria-hidden="true">${icone}</svg> <span>${esc(msg)}</span>`;
  document.body.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 0.2s ease";
    setTimeout(() => t.remove(), 220);
  }, 2900);
}
