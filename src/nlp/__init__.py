from src.core.config import COMPREHEND_ENABLED
from src.utils.logger import get_logger

log = get_logger(__name__)

_nlp_client = None


def get_nlp_client():
    global _nlp_client
    if _nlp_client is not None:
        return _nlp_client
    if COMPREHEND_ENABLED:
        from src.nlp.comprehend_client import ComprehendClient
        _nlp_client = ComprehendClient()
        log.info("NLP: AWS Comprehend ativado")
    else:
        from src.nlp.local_nlp import LocalNLPClient
        _nlp_client = LocalNLPClient()
        log.info("NLP: modo local (fallback por dicionário)")
    return _nlp_client
