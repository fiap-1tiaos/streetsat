import pytest
from src.data.blockage_parser import has_blockage


def test_blocked_freed_equal():
    assert has_blockage("[Bloqueado em 10:00] [Liberado em 12:00]") is False


def test_blocked_no_freed():
    assert has_blockage("[Bloqueado em 10:00]") is True


def test_multiple_blocked_one_freed():
    assert has_blockage("[Bloqueado em 10:00] [Bloqueado em 11:00] [Liberado em 12:00]") is True


def test_none_input():
    assert has_blockage(None) is False


def test_empty_input():
    assert has_blockage("") is False


def test_only_freed():
    assert has_blockage("[Liberado em 12:00]") is False


def test_no_blockage_mentions():
    assert has_blockage("Pista livre, fluxo normal.") is False
