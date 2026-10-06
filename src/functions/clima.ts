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
 * @example
 * Request:
 * GET /api/clima?ciudad=Guadalajara&pais=MX
 *
 * Headers:
 * Authorization: Bearer <JWT_TOKEN>
 */
export async function weather(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const usuario = verifyToken(request);

  if (!usuario) {
    return {
      status: 401,
      jsonBody: {
        error: "Invalid token or absent",
      },
    };
  }

  const ciudad = request.query.get("ciudad");
  const pais = request.query.get("pais");

  if (!ciudad) {
    return {
      status: 400,
      jsonBody: {
        error: 'The "ciudad" query parameter is required.',
      },
    };
  }

  const consulta = pais ? `${ciudad},${pais}` : ciudad;

  const url =
    `${config.weatherApiUrl}?q=${encodeURIComponent(consulta)}` +
    `&appid=${config.weatherApiKey}&units=metric&lang=es`;

  const response = await fetch(url);

  if (!response.ok) {
    await pool.query(
      "INSERT INTO error_log (user_id, city_consulted, message_error) VALUES ($1, $2, $3)",
      [
        usuario.id,
        consulta,
        `Status ${response.status}: city not found`,
      ]
    );

    return {
      status: 400,
      jsonBody: {
        error: "city not found",
      },
    };
  }

  const data = await response.json();

  await pool.query(
    "INSERT INTO weather_petition (user_id, city_consulted) VALUES ($1, $2)",
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
 * @route GET /api/clima?ciudad={city}&pais={country}
 */
app.http("clima", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "clima",
  handler: weather,
});