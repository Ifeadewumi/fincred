# tests/integration/test_health_endpoints.py
"""
Integration tests for health check endpoints.

Tests the /health, /health/db, and /health/detailed endpoints.
"""
import pytest
from fastapi import status
from fastapi.testclient import TestClient


@pytest.mark.integration
@pytest.mark.health
class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_basic_health_check(self, client: TestClient):
        """Test basic health check endpoint returns 200."""
        response = client.get("/api/v0/health")
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "FinCred API"
        assert "version" in data
        assert "environment" in data
    
    def test_database_health_check_healthy(self, client: TestClient):
        """Test database health check returns healthy status."""
        response = client.get("/api/v0/health/db")
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "response_time_ms" in data
        assert isinstance(data["response_time_ms"], (int, float))
        assert data["response_time_ms"] > 0
        
        assert "database_info" in data
        # SQLite doesn't return PostgreSQL version info, so it might be "Unknown"
        assert "version" in data["database_info"]
        assert "database" in data["database_info"]
    
    def test_detailed_health_check(self, client: TestClient):
        """Test detailed health check returns comprehensive status."""
        response = client.get("/api/v0/health/detailed")
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        
        # Check service info
        assert "service" in data
        assert data["service"]["name"] == "FinCred API"
        assert "version" in data["service"]
        assert "environment" in data["service"]
        
        # Check database info
        assert "database" in data
        assert data["database"]["status"] in ["healthy", "unhealthy"]
        
        # Check configuration info
        assert "configuration" in data
        assert "pool_size" in data["configuration"]
        assert "max_overflow" in data["configuration"]
        assert "pool_timeout" in data["configuration"]
    
    def test_health_endpoints_no_authentication_required(self, client: TestClient):
        """Test that health endpoints don't require authentication."""
        # Should work without auth headers
        response1 = client.get("/api/v0/health")
        assert response1.status_code == status.HTTP_200_OK
        
        response2 = client.get("/api/v0/health/db")
        assert response2.status_code == status.HTTP_200_OK
        
        response3 = client.get("/api/v0/health/detailed")
        assert response3.status_code == status.HTTP_200_OK
