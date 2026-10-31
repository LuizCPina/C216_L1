/**
 * Regras de validacao do formulario de usuarios.
 *
 * Sao funcoes puras: nao tocam no DOM, nao guardam estado e nao dependem do
 * React. Por isso ficam em um arquivo .js comum, sem JSX, e sao testadas
 * isoladamente em tests/unit/validation.test.js.
 *
 * O limite de 80 caracteres do nome e a normalizacao do email vem do backend
 * (app/schemas/user.py e app/validacoes.py). Ja a checagem de formato do email
 * aqui e de proposito mais rigorosa: o backend exige apenas que exista um "@",
 * e barrar o erro antes de sair da tela poupa uma viagem ate a API. O backend
 * segue sendo a autoridade — esta validacao e conveniencia, nao garantia.
 */

export const LIMITE_NOME = 80;

/** Remove espacos das pontas e padroniza o email em minusculas. */
export function normalizarEmail(email) {
  if (typeof email !== "string") {
    return "";
  }
  return email.trim().toLowerCase();
}

/** Mensagem de erro do nome, ou null se estiver valido. */
export function validarNome(nome) {
  const limpo = typeof nome === "string" ? nome.trim() : "";
  if (limpo === "") {
    return "Informe o nome.";
  }
  if (limpo.length > LIMITE_NOME) {
    return `O nome deve ter no maximo ${LIMITE_NOME} caracteres.`;
  }
  return null;
}

/** Mensagem de erro do email, ou null se estiver valido. */
export function validarEmail(email) {
  const limpo = normalizarEmail(email);
  if (limpo === "") {
    return "Informe o email.";
  }
  if (!limpo.includes("@")) {
    return "Email invalido: falta o @.";
  }
  if (/\s/.test(limpo)) {
    return "Email invalido.";
  }

  // Dividir e contar as partes, em vez de olhar so o primeiro "@": um endereco
  // como "ana@teste.com@outro" tem tres partes e precisa ser recusado, nao
  // truncado nas duas primeiras.
  const partes = limpo.split("@");
  if (partes.length !== 2) {
    return "Email invalido.";
  }

  // O dominio precisa de ao menos um ponto com texto dos dois lados, para que
  // "ana@teste" e "ana@.com" nao passem.
  const [usuario, dominio] = partes;
  const rotulos = dominio.split(".");
  if (usuario === "" || rotulos.length < 2 || rotulos.includes("")) {
    return "Email invalido.";
  }

  return null;
}

/**
 * Valida o formulario inteiro.
 *
 * Devolve um objeto com uma chave por campo com erro. Objeto vazio significa
 * formulario valido, o que deixa a checagem em quem chama como
 * `Object.keys(erros).length === 0`.
 */
export function validarUsuario({ nome, email }, usuariosExistentes = []) {
  const erros = {};

  const erroNome = validarNome(nome);
  if (erroNome) {
    erros.nome = erroNome;
  }

  const erroEmail = validarEmail(email);
  if (erroEmail) {
    erros.email = erroEmail;
  } else if (emailJaUsado(email, usuariosExistentes)) {
    erros.email = "Este email ja esta cadastrado.";
  }

  return erros;
}

/** Indica se o email ja pertence a algum usuario da lista. */
export function emailJaUsado(email, usuarios = []) {
  const alvo = normalizarEmail(email);
  return usuarios.some((usuario) => normalizarEmail(usuario.email) === alvo);
}

/** Filtra usuarios por um trecho do nome, ignorando maiusculas. */
export function filtrarPorNome(usuarios = [], termo = "") {
  const busca = termo.trim().toLowerCase();
  if (busca === "") {
    return usuarios;
  }
  return usuarios.filter((usuario) => usuario.nome.toLowerCase().includes(busca));
}
