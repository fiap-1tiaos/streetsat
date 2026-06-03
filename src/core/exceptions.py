class StreetSatError(Exception):
    pass


class ModelNotFoundError(StreetSatError):
    pass


class DataValidationError(StreetSatError):
    pass


class ScraperError(StreetSatError):
    pass


class APIClientError(StreetSatError):
    pass


class CacheError(StreetSatError):
    pass


class NLPError(StreetSatError):
    pass


class RoutingError(StreetSatError):
    pass
