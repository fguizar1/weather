import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

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

app.http('HealthCheck', {
  methods: ['GET'],
  route: 'v1/health',
  authLevel: 'function',
  handler: healthCheck,
});