import logging
from typing import Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
MAPS_SEARCH_URL = "https://www.google.com/maps/search/"


def geocode_address(address: Optional[str], city: Optional[str] = None):
    """Lookup coordinates for the provided address using Google Maps.

    Returns a dict with lat, lng and place_id when successful. None otherwise.
    """
    api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", None)
    if not api_key:
        logger.debug("Skipping geocode: GOOGLE_MAPS_API_KEY not configured")
        return None

    parts = [part for part in (address, city) if part]
    if not parts:
        return None

    query = ", ".join(parts)
    params = {"address": query, "key": api_key}
    timeout = getattr(settings, "GOOGLE_MAPS_GEOCODE_TIMEOUT", 5)

    try:
        response = requests.get(GEOCODE_URL, params=params, timeout=timeout)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:
        logger.warning("Google Maps geocoding failed for '%s': %s", query, exc)
        return None

    if payload.get("status") != "OK" or not payload.get("results"):
        logger.debug("Google Maps returned no results for '%s': %s", query, payload.get("status"))
        return None

    result = payload["results"][0]
    geometry = result.get("geometry", {}).get("location", {})
    return {
        "lat": geometry.get("lat"),
        "lng": geometry.get("lng"),
        "place_id": result.get("place_id"),
        "formatted_address": result.get("formatted_address"),
    }


def build_maps_url(lat: Optional[str], lng: Optional[str]) -> Optional[str]:
    """Return a browser friendly Google Maps URL for the provided coordinates."""
    if lat is None or lng is None:
        return None
    return f"{MAPS_SEARCH_URL}?api=1&query={lat},{lng}"

