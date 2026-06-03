import pytest
from unittest.mock import MagicMock, patch
from src.scrapers.artesp_scraper import ARTESPScraper

MOCK_HTML = """
<html><body>
<p>Página 1 de 2</p>
<table>
  <thead><tr><th>Código</th><th>Tipo</th><th>Rodovia</th><th>KM</th><th>Município</th><th>Interdição</th><th>Criticidade</th><th>Status</th></tr></thead>
  <tbody>
    <tr>
      <td><a href="/rodovias/oc19500">OC-19500</a></td>
      <td>acidente</td><td>SP-330</td><td>225,5</td>
      <td>Guarulhos</td><td>Bloqueio Parcial</td><td>3</td><td>Ativa</td>
    </tr>
    <tr>
      <td><a href="/rodovias/oc19501">OC-19501</a></td>
      <td>obra</td><td>BR-116</td><td>100,0</td>
      <td>Campinas</td><td>Livre</td><td>1</td><td>Ativa</td>
    </tr>
  </tbody>
</table>
</body></html>
"""

MOCK_HTML_LAST = """
<html><body>
<p>Página 2 de 2</p>
<table>
  <thead><tr><th>Código</th><th>Tipo</th><th>Rodovia</th><th>KM</th><th>Município</th><th>Interdição</th><th>Criticidade</th><th>Status</th></tr></thead>
  <tbody></tbody>
</table>
</body></html>
"""


@pytest.fixture
def scraper():
    return ARTESPScraper()


def test_detect_total_pages(scraper):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(MOCK_HTML, "lxml")
    total = scraper._detect_total_pages(soup)
    assert total == 2


def test_parse_occurrences_returns_list(scraper):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(MOCK_HTML, "lxml")
    rows = scraper._parse_occurrences_table(soup)
    assert isinstance(rows, list)
    assert len(rows) == 2


def test_scrape_occurrences_with_mock(scraper):
    mock_resp = MagicMock()
    mock_resp.text = MOCK_HTML
    mock_resp.raise_for_status = MagicMock()

    with patch.object(scraper.session, "get", return_value=mock_resp):
        rows, total_pages = scraper.scrape_occurrences(page=1)

    assert total_pages == 2
    assert len(rows) == 2


def test_interdiction_normalization(scraper):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(MOCK_HTML, "lxml")
    rows = scraper._parse_occurrences_table(soup)
    first = rows[0]
    assert "interdiction_level" in first
    assert first["interdiction_level"] in (0, 1, 2)
