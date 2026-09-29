import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import bcrypt from "bcryptjs";
import { pool } from "../shared/db.js";
import { generateToken } from "../shared/auth.js";

/**
 * Authenticates a registered user and generates a JSON Web Token (JWT).
 *
 * This function validates the credentials provided by the client against
 * the user records stored in the PostgreSQL database. If the credentials
 * are valid, a JWT is generated and returned to the client.
 *
 * @param request - HTTP request containing the user's credentials.
 * @param context - Azure Functions invocation context.
 *
 * @returns A promise that resolves to an HTTP response containing either
 * the generated JWT or an authentication error.
 *
 * @throws {Error} If an unexpected error occurs during the database
 * operation or credential validation.
 *
 * @example
 * Request:
 * POST /api/auth/login
 *
 * {
 *   "username": "paco",
 *   "password": "1234"
 * }
 *
 * Successful response:
 * HTTP 200 OK
 *
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 */
export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const body = (await request.json()) as {
    username: string;
    password: string;
  };

const result = await pool.query(
  "SELECT * FROM usuarios WHERE LOWER(username) = LOWER($1)",
  [body.username]
);

  const usuario = result.rows[0];

  if (
    !usuario ||
    !(await bcrypt.compare(body.password, usuario.password_hash))
  ) {
    return {
      status: 401,
      jsonBody: {
        error: 'User o password incorrect',
      },
    };
  }

  const token = generateToken({
    id: usuario.id,
    username: usuario.username,
  });

  return {
    status: 200,
    jsonBody: {
      token,
    },
  };
}

/**
 * Registers the user authentication HTTP endpoint.
 *
 * @description
 * Exposes an HTTP POST endpoint that allows users to authenticate
 * using their username and password.
 */
app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
