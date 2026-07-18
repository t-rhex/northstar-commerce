import unittest

from app import app


class AnalyticsApplicationTest(unittest.TestCase):
    def test_application_has_health_route(self):
        paths = {route.path for route in app.routes}
        self.assertIn("/health", paths)


if __name__ == "__main__":
    unittest.main()
