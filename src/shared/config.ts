import "dotenv/config";

/**
 * Application configuration object.
 *
 * Centralizes the configuration parameters required by the application,
 * including JWT authentication settings and OpenWeatherMap API credentials.
 *
 * Sensitive values are retrieved from environment variables to prevent
 * exposing credentials directly in the source code.
 *
 * @constant
 */
export const config = {
  /**
   * Secret key used to sign and verify JSON Web Tokens (JWT).
   *
   * @type {string}
   * @see JWT_SECRET environment variable
   */
  jwtSecret: process.env.JWT_SECRET as string,

  /**
   * JWT expiration time.
   *
   * Defines the period of validity for generated authentication tokens.
   *
   * @type {"2h"}
   */
  jwtExpiresIn: '2h' as const,

  /**
   * API key used to authenticate requests to OpenWeatherMap.
   *
   * @type {string}
   * @see WEATHER_API_KEY environment variable
   */
  weatherApiKey: process.env.WEATHER_API_KEY as string,

  /**
   * Base URL of the OpenWeatherMap current weather API.
   *
   * @type {string}
   */
  weatherApiUrl: "https://api.openweathermap.org/data/2.5/weather",
};
