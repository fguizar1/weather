import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import { pool } from "../shared/db.ts";
import { verifyToken } from "../shared/auth.ts";
import { config } from "../shared/config.ts";

/**
 * Retrieves weather information for a specified city.
 *
 * This function authenticates the request using a JWT, retrieves weather
 * data from the configured weather service, and records the request in
 * the PostgreSQL database.
 *
 * If the weather service fails to locate the requested city, the error
 * is recorded in the error log.
 *
 * @param request - HTTP request containing the city name as a route
 * parameter and an optional country code as a query parameter.
 * @param context - Azure Functions invocation context.
 *
 * @returns A promise that resolves to an HTTP response containing the
 * weather information or an appropriate error message.
 *
 * @throws {Error} If an unexpected error occurs during token validation,
 * external API communication, or database operations.
 *
 * @example
 * Request:
 * GET /api/weather/Guadalajara?pais=MX
 *
 * Headers:
 * Authorization: Bearer <JWT_TOKEN>
 *
 * Successful response:
 * HTTP 200 OK
 *
 * {
 *   "name": "Guadalajara",
 *   "main": {
 *     "temp": 25.4,
 *     "humidity": 60
 *   },
 *   "weather": [
 *     {
 *       "description": ""
 *     }
 *   ]
 * }
 */
export async function weather(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const usuario = verifyToken(request);

  if (!usuario) {
    return {
      status: 401,
      jsonBody: {
        error: 'Invalid token o absent',
      },
    };
  }

  const ciudad = request.params.ciudad;
  const pais = request.query.get('pais');
  const consulta = pais ? `${ciudad},${pais}` : ciudad;

  const url = `${config.weatherApiUrl}?q=${consulta}&appid=${config.weatherApiKey}&units=metric&lang=es`;

  const response = await fetch(url);

  if (!response.ok) {
    await pool.query(
      "INSERT INTO errores_log (usuario_id, ciudad_consultada, mensaje_error) VALUES ($1, $2, $3)",
      [
        usuario.id,
        consulta,
        `Status ${response.status}: city no found`,
      ]
    );

    return {
      status: 400,
      jsonBody: {
        error: 'city no found',
      },
    };
  }

  const data = await response.json();

  await pool.query(
    "INSERT INTO peticiones_clima (usuario_id, ciudad_consultada) VALUES ($1, $2)",
    [usuario.id, consulta]
  );

  return {
    status: 200,
    jsonBody: data,
  };
}

/**
 * Registers the weather forecast HTTP endpoint.
 *
 * @description
 * Exposes an HTTP GET endpoint that retrieves weather information
 * for a specified city and optionally filters the request by country.
 *
 * Authentication is performed using a JWT provided in the request.
 *
 * @route GET /api/weather/{city}
 * @access Authenticated users
 */
app.http('clima', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'clima/{ciudad}',
  handler: weather,
});
