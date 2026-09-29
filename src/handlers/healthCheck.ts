import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

/**
 * Provides the health status of the application.
 *
 * This function returns information about the application's current
 * operational status, process uptime, execution timestamp, and
 * application version.
 *
 * The endpoint can be used to verify whether the application is
 * running and responding to HTTP requests.
 *
 * @param request - HTTP request received by the Azure Function.
 * @param context - Azure Functions invocation context.
 *
 * @returns A promise that resolves to an HTTP response containing
 * the application's health status and runtime information.
 *
 * @example
 * Request:
 * GET /api/healthCheck
 *
 * Successful response:
 * HTTP 200 OK
 *
 * {
 *   "status": "ok",
 *   "uptime": 125.45,
 *   "timestamp": "2026-09-21T18:00:00.000Z",
 *   "version": "1.0.0"
 * }
 */
export async function healthCheck(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const response = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
  };

  return {
    status: 200,
    jsonBody: response,
  };
}

/**
 * Registers the application health-check HTTP endpoint.
 *
 * @description
 * Exposes an HTTP GET endpoint that provides application runtime
 * information, including operational status, uptime, timestamp,
 * and application version.
 *
 * The endpoint does not require Azure Functions authentication.
 */
app.http('healthCheck', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: healthCheck,
});
