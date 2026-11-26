/** Testes unitarios da formatacao de valores. */

import { describe, expect, it } from "vitest";
import { formatarDataHora } from "../../src/formatacao.js";

describe("formatarDataHora", () => {
  it("usa o formato brasileiro de data", () => {
    // Meio-dia em UTC: a data e a mesma em qualquer fuso do Brasil.
    expect(formatarDataHora("2026-11-26T12:00:00Z")).toMatch(/^26\/11\/2026/);
  });

  it("mostra um traço quando não há data", () => {
    expect(formatarDataHora(null)).toBe("—");
  });
});
