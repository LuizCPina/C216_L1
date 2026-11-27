"""Resumo dos testes em portugues, em Markdown, para a pagina do GitHub Actions.

Le dois arquivos em formatos padrao, que tanto o pytest quanto o Vitest geram:
- JUnit XML: o resultado de cada teste;
- Cobertura XML: quais linhas do codigo os testes executaram.

Uso:
    python scripts/resumo_testes.py <titulo> <junit.xml> <cobertura.xml>

O resumo sai na saida padrao. No CI ela vai para o arquivo $GITHUB_STEP_SUMMARY,
e o GitHub mostra o Markdown na pagina da execucao. O script so usa a
biblioteca padrao do Python, entao roda tambem no job do frontend.
"""

import html
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def ler_testes(caminho: Path) -> tuple[list[dict], float, int]:
    """Le o JUnit: os testes, o tempo total e as falhas que o arquivo declara."""
    raiz = ET.parse(caminho).getroot()
    testes = []
    for caso in raiz.iter("testcase"):
        falha = caso.find("failure")
        if falha is None:
            falha = caso.find("error")
        if falha is not None:
            situacao, mensagem = "falhou", motivo_da_falha(falha)
        elif caso.find("skipped") is not None:
            situacao, mensagem = "pulado", ""
        else:
            situacao, mensagem = "passou", ""
        grupo, nome = caso.get("classname", ""), caso.get("name", "")
        if grupo and nome != grupo:
            grupo, nome = nome_do_grupo(grupo), nome_do_teste(nome)
        else:
            # Quando um arquivo de teste nem carrega (um erro de sintaxe, por
            # exemplo), o pytest deixa o classname vazio e o Vitest repete o
            # arquivo: nos dois, o proprio arquivo aparece no lugar do teste.
            grupo, nome = nome_do_grupo(nome), "o arquivo não carregou"
        testes.append(
            {"grupo": grupo, "nome": nome, "situacao": situacao, "mensagem": mensagem}
        )
    suites = list(raiz.iter("testsuite"))
    tempo = float(raiz.get("time") or sum(float(s.get("time", 0)) for s in suites))
    # Conferencia: um erro fora dos testes (um arquivo que nem carregou, por
    # exemplo) entra na contagem da suite, mas pode nao virar um testcase.
    declaradas = sum(
        int(s.get("failures", 0)) + int(s.get("errors", 0)) for s in suites
    )
    return testes, tempo, declaradas


def motivo_da_falha(falha: ET.Element) -> str:
    """A mensagem da falha. Quando o arquivo nem carrega, o pytest so diz
    "collection failure": o motivo de verdade e a ultima linha "E" do texto."""
    mensagem = falha.get("message") or ""
    if mensagem in ("", "collection failure"):
        texto_completo = (falha.text or "").splitlines()
        linhas_e = [li[1:].strip() for li in texto_completo if li.startswith("E ")]
        if linhas_e:
            mensagem = linhas_e[-1]
    # Tira os codigos de cor do terminal. O XML nao aceita o caractere ESC,
    # entao o pytest grava ele como o texto "#x1B".
    return re.sub(r"(?:\x1b|#x1B)\[[0-9;]*m", "", mensagem)


def nome_do_grupo(classname: str) -> str:
    """Arquivo do teste. O pytest separa as pastas com ponto
    (tests.unit.test_x); o Vitest ja manda o caminho (tests/unit/x.test.js)."""
    if "/" in classname:
        return classname
    return classname.replace(".", "/") + ".py"


def nome_do_teste(nome: str) -> str:
    """Nome legivel: test_recusa_placar_empatado vira "recusa placar empatado"."""
    if nome.startswith("test_"):
        return nome.removeprefix("test_").replace("_", " ")
    return nome.replace(" > ", " › ")


def ler_cobertura(caminho: Path) -> tuple[int, int, list[dict]]:
    """Le o XML de cobertura: linhas cobertas, linhas no total e cada arquivo."""
    raiz = ET.parse(caminho).getroot()
    # O coverage.py (com relative_files) diz que os arquivos ficam em "app" e
    # manda o resto do caminho. O Vitest manda o caminho inteiro a partir da
    # pasta do projeto, que ele informa como caminho absoluto.
    fonte = raiz.findtext("sources/source", default="")
    prefixo = "" if os.path.isabs(fonte) else fonte
    arquivos = []
    for classe in raiz.iter("class"):
        nome = classe.get("filename", "").replace("\\", "/")
        if prefixo:
            nome = f"{prefixo}/{nome}"
        # So as linhas da propria classe: o Vitest repete algumas dentro de
        # cada funcao (methods), e elas seriam contadas duas vezes.
        linhas = classe.find("lines")
        acertos = [] if linhas is None else [int(li.get("hits", 0)) for li in linhas]
        arquivos.append(
            {"nome": nome, "total": len(acertos), "sem_teste": acertos.count(0)}
        )
    total = int(raiz.get("lines-valid", 0))
    cobertas = int(raiz.get("lines-covered", 0))
    return cobertas, total, arquivos


def porcentagem(parte: int, total: int) -> str:
    """98.86 vira "98,9%". Com alguma linha faltando, nunca mostra 100%."""
    valor = 100 * parte / total
    if parte < total:
        valor = min(valor, 99.9)
    return f"{valor:.1f}".replace(".", ",").removesuffix(",0") + "%"


def plural(quantidade: int, singular: str, plural_: str) -> str:
    return f"{quantidade} {singular if quantidade == 1 else plural_}"


def texto(valor: str) -> str:
    """Escapa o texto para nao virar HTML nem formatacao do Markdown."""
    valor = html.escape(valor, quote=False)
    for caractere in "\\`*_[]|":
        valor = valor.replace(caractere, "\\" + caractere)
    return valor


def secao_do_placar(
    titulo: str, testes: list[dict], tempo: float, declaradas: int
) -> list[str]:
    """Titulo com o placar, a tabela e, se houver, as falhas com o motivo."""
    total = len(testes)
    passaram = sum(t["situacao"] == "passou" for t in testes)
    falharam = sum(t["situacao"] == "falhou" for t in testes)
    pulados = sum(t["situacao"] == "pulado" for t in testes)

    if total == 0:
        cabecalho = f"⚠️ {titulo}: nenhum teste encontrado"
    elif falharam:
        verbo = "falhou" if falharam == 1 else "falharam"
        cabecalho = (
            f"❌ {titulo}: {falharam} de {plural(total, 'teste', 'testes')} {verbo}"
        )
    else:
        verbo = "passou" if passaram == 1 else "passaram"
        cabecalho = (
            f"✅ {titulo}: {passaram} de {plural(total, 'teste', 'testes')} {verbo}"
        )
        if pulados:
            cabecalho += f" ({plural(pulados, 'pulado', 'pulados')})"

    segundos = f"{tempo:.1f}".replace(".", ",")
    linhas = [
        f"## {cabecalho}",
        "",
        "| Passaram | Falharam | Pulados | Total | Tempo |",
        "| ---: | ---: | ---: | ---: | ---: |",
        f"| {passaram} | {falharam} | {pulados} | {total} | {segundos} s |",
        "",
    ]
    if declaradas > falharam:
        aviso = (
            "⚠️ Houve erro fora dos testes (por exemplo, um arquivo de teste "
            "que não carregou). Veja o log do passo que roda os testes."
        )
        linhas += [aviso, ""]

    if falharam:
        linhas += ["### Falhas", ""]
        for teste in testes:
            if teste["situacao"] != "falhou":
                continue
            motivo = "\n".join(teste["mensagem"].strip().splitlines()[:5])[:500]
            linhas += [
                f"- ❌ **{texto(teste['grupo'])}** › {texto(teste['nome'])}",
                "  ```",
                *(f"  {linha}" for linha in motivo.replace("```", "'''").splitlines()),
                "  ```",
            ]
        linhas.append("")
    return linhas


def secao_da_lista(testes: list[dict]) -> list[str]:
    """Todos os testes, por arquivo, numa secao que so abre ao clicar."""
    quais = "o teste" if len(testes) == 1 else f"os {len(testes)} testes"
    linhas = ["<details>", f"<summary>Ver {quais}</summary>", ""]
    grupos: dict[str, list[dict]] = {}
    for teste in testes:
        grupos.setdefault(teste["grupo"], []).append(teste)
    simbolo = {"passou": "✅", "falhou": "❌", "pulado": "⏭️"}
    for grupo, do_grupo in grupos.items():
        linhas += [f"**{texto(grupo)}** ({len(do_grupo)})", ""]
        linhas += [f"- {simbolo[t['situacao']]} {texto(t['nome'])}" for t in do_grupo]
        linhas.append("")
    linhas += ["</details>", ""]
    return linhas


def secao_da_cobertura(caminho: Path) -> list[str]:
    """Cobertura em uma frase e so os arquivos que tem alguma linha sem teste."""
    if not caminho.exists():
        return ["### Cobertura", "", "O arquivo de cobertura não foi gerado.", ""]
    cobertas, total, arquivos = ler_cobertura(caminho)
    if total == 0:
        return ["### Cobertura", "", "Nenhuma linha de código foi medida.", ""]
    titulo = f"{porcentagem(cobertas, total)} das linhas do código rodam nos testes"
    explicacao = (
        "Cobertura é a parte do código que os testes executam. "
        f"São {cobertas} de {total} linhas."
    )
    linhas = [f"### Cobertura: {titulo}", "", explicacao, ""]
    incompletos = sorted(
        (a for a in arquivos if a["sem_teste"]),
        key=lambda a: (a["total"] - a["sem_teste"]) / a["total"],
    )
    if incompletos:
        linhas += [
            "| Arquivo com linhas sem teste | Cobertura | Linhas sem teste |",
            "| --- | ---: | ---: |",
        ]
        for arquivo in incompletos:
            cobertura = porcentagem(
                arquivo["total"] - arquivo["sem_teste"], arquivo["total"]
            )
            linhas.append(
                f"| `{arquivo['nome']}` | {cobertura} | {arquivo['sem_teste']} |"
            )
        linhas.append("")
    completos = len(arquivos) - len(incompletos)
    if completos:
        quantos = plural(completos, "arquivo está", "arquivos estão")
        inicio = "Os outros" if incompletos else "Todos os"
        linhas += [f"{inicio} {quantos} com 100%.", ""]
    return linhas


def montar_resumo(titulo: str, junit: Path, cobertura: Path) -> str:
    """Placar e falhas, depois a cobertura e, no fim, a lista recolhida."""
    try:
        if not junit.exists():
            aviso = f"## ⚠️ {titulo}: o resultado dos testes não foi gerado"
            linhas = [aviso, "", "Veja o log do passo que roda os testes.", ""]
            linhas += secao_da_cobertura(cobertura)
        else:
            testes, tempo, declaradas = ler_testes(junit)
            linhas = secao_do_placar(titulo, testes, tempo, declaradas)
            linhas += secao_da_cobertura(cobertura)
            linhas += secao_da_lista(testes)
    except ET.ParseError as erro:
        linhas = [f"## ⚠️ {titulo}: não deu para ler os relatórios ({erro})"]
    return "\n".join(linhas)


def main(argumentos: list[str]) -> int:
    if len(argumentos) != 4:
        print(__doc__, file=sys.stderr)
        return 2
    # No Windows a saida padrao nao e UTF-8, e os emojis dariam erro.
    sys.stdout.reconfigure(encoding="utf-8")
    titulo, junit, cobertura = argumentos[1], Path(argumentos[2]), Path(argumentos[3])
    print(montar_resumo(titulo, junit, cobertura))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
