import re


def has_blockage(interdicoes: str | None) -> bool:
    if not interdicoes:
        return False
    blocked = re.findall(r"\[Bloqueado em[^\]]*\]", interdicoes)
    freed = re.findall(r"\[Liberado em[^\]]*\]", interdicoes)
    active = len(blocked) - len(freed)
    return active > 0
