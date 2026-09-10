/**
 * Single source of truth for environment-driven constants.
 * Pulls from .env / .env.production instead of components hardcoding
 * "https://vrplay.in" directly.
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "/api_proxy";

// Used for building <img src> URLs (e.g. https://vrplay.in/images/vrplay1/xyz.png)
export const ASSET_BASE_URL =
  process.env.REACT_APP_ASSET_BASE_URL || "https://vrplay.in/images";
