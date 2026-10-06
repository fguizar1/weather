import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

import bcrypt from "bcryptjs";
import * as yup from "yup";
import { pool } from "../shared/db.ts";

/**
 * Validation schema for user registration.
 *
 * Defines the validation rules for the username and password fields.
 * The username must contain at least three characters, while the password
 * must contain at least four characters.
 */
const recordSchema = yup.object({
  username: yup
    .string()
    .required('The user is requested.')
    .min(3, 'The username must be at least 3 characters long.'),

  password: yup
    .string()
    .required('The password is requested.')
    .min(4, 'The password must be at least 4 characters long.'),
});

/**
 * Registers a new user in the system.
 *
 * This function validates the registration data, verifies whether the
 * username is already registered, hashes the password using bcrypt, and
 * stores the new user's credentials in the PostgreSQL database.
 *
 * @param request - HTTP request containing the registration credentials.
 * @param context - Azure Functions invocation context.
 *
 * @returns A promise that resolves to an HTTP response indicating whether
 * the user was successfully registered or the request was rejected.
 *
 * @throws {Error} If an unexpected error occurs during the validation,
 * password hashing, or database operations.
 *
 * @example
 * Request:
 * POST /api/auth/record
 *
 * {
 *   "username": "paco",
 *   "password": "1234"
 * }
 *
 * Successful response:
 * HTTP 201 Created
 *
 * {
 *   "message": "User create"
 * }
 *
 * @example
 * Error response:
 * HTTP 400 Bad Request
 *
 * {
 *   "error": "The user already exist"
 * }
 */
export async function record(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const body = await request.json() as { username?: string; password?: string };

  if (typeof body.username === 'string') {
    body.username = body.username.trim();
  }


  try {
    await recordSchema.validate(body, { abortEarly: true });
  } catch (err: any) {
    return {
      status: 400,
      jsonBody: {
        errores: err.errors,
      },
    };
  }

  const { username, password } = body as {
    username: string;
    password: string;
  };

const existe = await pool.query(
  'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
  [username]
);
  if (existe.rows.length > 0) {
    return {
      status: 400,
      jsonBody: {
        error: 'The user already exist',
      },
    };
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
    [username, hash]
  );

  return {
    status: 201,
    jsonBody: {
      message: 'User create',
    },
  };
}

/**
 * Registers the user registration HTTP endpoint.
 *
 * @description
 * Exposes an HTTP POST endpoint that allows new users to register
 * using a unique username and a password that meets the validation
 * requirements.
 *
 * The endpoint does not require Azure Functions authentication.
 */
app.http('registro', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/registro',
  handler: record,
});
