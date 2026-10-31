/**
 * Setup carregado pelo Vitest antes de cada arquivo de teste.
 *
 * O import do jest-dom acrescenta matchers de DOM ao expect
 * (toBeInTheDocument, toHaveValue, ...). O cleanup desmonta os componentes
 * entre testes, para que um teste nao enxergue o que o anterior renderizou.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
