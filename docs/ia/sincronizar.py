"""Cópia versionada das regras e skills da VEB, que ficam fora do Git, em C:\\veb.

Fonte de verdade: C:\\veb\\CLAUDE.md e C:\\veb\\.claude\\skills\\ (o Claude lê dali).
Cópia versionada: este diretório (docs/ia/CLAUDE-raiz.md e docs/ia/skills/).

Uso (na raiz do repositório da plataforma):
  python docs/ia/sincronizar.py              copia C:\\veb -> docs/ia (depois, faça o commit)
  python docs/ia/sincronizar.py --conferir   só compara; sai com 1 se estiverem diferentes
  python docs/ia/sincronizar.py --restaurar  docs/ia -> C:\\veb (máquina nova ou edição errada)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
VEB = AQUI.parents[2]  # docs/ia -> docs -> voltaexpress -> C:\veb
PARES = [(VEB / "CLAUDE.md", AQUI / "CLAUDE-raiz.md")]


def conteudo(p: Path) -> bytes:
    """Bytes com fim de linha LF: o Git (autocrlf) põe CRLF na cópia, e isso não conta como diferença."""
    return p.read_bytes().replace(bytes([13, 10]), bytes([10]))


def pares_skills() -> list[tuple[Path, Path]]:
    origem, copia = VEB / ".claude" / "skills", AQUI / "skills"
    nomes = {p.relative_to(origem) for p in origem.rglob("*") if p.is_file()} if origem.exists() else set()
    nomes |= {p.relative_to(copia) for p in copia.rglob("*") if p.is_file()} if copia.exists() else set()
    return [(origem / n, copia / n) for n in sorted(nomes)]


def main() -> None:
    args = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    modo = args.add_mutually_exclusive_group()
    modo.add_argument("--conferir", action="store_true")
    modo.add_argument("--restaurar", action="store_true")
    a = args.parse_args()

    diferentes = []
    for fonte, copia in PARES + pares_skills():
        de, para = (copia, fonte) if a.restaurar else (fonte, copia)
        igual = de.exists() and para.exists() and conteudo(de) == conteudo(para)
        if igual:
            continue
        diferentes.append(f"{'falta' if not de.exists() else 'diferente'}: {para.relative_to(VEB)}")
        if a.conferir or not de.exists():
            continue
        para.parent.mkdir(parents=True, exist_ok=True)
        para.write_bytes(conteudo(de))
        print(f"copiado: {de.relative_to(VEB)} -> {para.relative_to(VEB)}")

    if a.conferir:
        if diferentes:
            print("Fora de sincronia:\n  " + "\n  ".join(diferentes))
            sys.exit(1)
        print("Em sincronia: CLAUDE.md da raiz e skills iguais à cópia versionada.")
    elif not diferentes:
        print("Nada a copiar: já está em sincronia.")
    else:
        sem_origem = [d for d in diferentes if d.startswith("falta")]
        if sem_origem:
            print("Atenção, existe só de um lado (não apaguei nada):\n  " + "\n  ".join(sem_origem))


if __name__ == "__main__":
    main()
