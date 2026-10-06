# Weather Query API with JWT Authentication

API built with Azure Functions (Node.js/TypeScript) that allows users to register, log in, and query the weather of cities using JWT authentication.

The API uses PostgreSQL to store users, successful weather queries, and errors. Each weather query and error is associated with the authenticated user who generated it.

The API also supports city searches using an optional country code, allowing the same endpoint to query a city by name only or by city name and country code.

## Features

- User registration with password hashing using `bcryptjs`
- User login with JWT token generation
- Weather queries protected by JWT authentication
- Input validation using `Yup`
- Case-insensitive unique usernames
- PostgreSQL database integration
- Database record of successful weather queries
- Database record of weather errors
- City search by name
- City search by name and country code
- Database migrations using `node-pg-migrate`
- Database seeding with default users
- Environment variable configuration using `.env`
- API testing with Postman
- Automatic JWT token management in Postman
- API documentation using Swagger/OpenAPI YAML
- Unit testing with Vitest

## Stack

| Technology | Usage |
|---|---|
| Node.js + TypeScript | Runtime and development language |
| Azure Functions v4 | Serverless API framework |
| PostgreSQL | Database |
| `pg` | PostgreSQL client |
| pgAdmin4 | Database management |
| JSON Web Tokens (JWT) | Authentication |
| `bcryptjs` | Password hashing |
| Yup | Input validation |
| OpenWeatherMap | Weather data |
| `node-pg-migrate` | Database migrations |
| `dotenv` | Environment variables |
| Vitest | Unit testing |
| Postman | API testing |
| Swagger/OpenAPI | API documentation |

## Prerequisites

Before starting, install:

- [Node.js](https://nodejs.org/) v24.20 or higher
- npm v11.19 or higher
- [PostgreSQL](https://www.postgresql.org/)
- [pgAdmin4](https://www.pgadmin.org/) or another PostgreSQL client
- A free API key from [OpenWeatherMap](https://home.openweathermap.org/users/sign_in)
- [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local)

Check the installed versions:

```bash
node -v
npm -v
```

## Project Structure

```text
template-servicios-typescript/

├── src/
│   ├── functions/
│   │   ├── registro.ts
│   │   ├── login.ts
│   │   ├── clima.ts
│   │   └── healthCheck.ts
│   │
│   ├── scripts/
│   │   └── seed.ts
│   │
│   └── shared/
│       ├── config.js
│       ├── db.js
│       └── auth.js
│
├── tests/
│   ├── registro.test.ts
│   ├── login.test.ts
│   └── clima.test.ts
│
├── migrations/
│   └── 1790696365770_init-schema.js
│
├── docs/
│   ├── v1.yaml
│
├── .env
├── .env.example
├── local.settings.json
├── migrate.config.cjs
├── package.json
└── README.md
```

The exact filenames can vary depending on the current project version, but the main organization is based on `src/functions`, `src/scripts`, `src/shared`, `tests`, `migrations`, and `docs`.

## Installation

### 1. Clone the project

```bash
git clone <repository-url>
cd template-servicios-typescript
```

### 2. Install dependencies

```bash
npm install
```

## Environment Configuration

The project uses environment variables for the PostgreSQL database, JWT, and OpenWeatherMap configuration.

### 3. Create the `.env` file

If the project contains an `.env.example` file, copy it:

```bash
cp .env.example .env
```

On Windows Command Prompt, you can also copy it with:

```cmd
copy .env.example .env
```

Configure the variables in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key

WEATHER_API_KEY=your-openweathermap-api-key
```

Do not commit the real `.env` file or real credentials to the repository.

### Environment variable description

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL server host |
| `DB_PORT` | PostgreSQL server port |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `WEATHER_API_KEY` | OpenWeatherMap API key |

The migration system does **not** require a separate `DATABASE_URL`. The values from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` are loaded from `.env` through `migrate.config.cjs`.

## Azure Functions Local Configuration

Azure Functions also uses `local.settings.json` for local runtime configuration.

The project requires the following settings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true"
  }
}
```

`FUNCTIONS_WORKER_RUNTIME` defines the runtime used by Azure Functions, while `AzureWebJobsStorage` provides the local storage configuration expected by the Functions runtime.

Keep this file consistent with the local configuration required by the project. If secrets are added to it later, do not commit those secrets to the repository.

## Database Configuration

### 4. Create the PostgreSQL database

Create the database from pgAdmin4 or another PostgreSQL client:

```sql
CREATE DATABASE weather;
```

The database itself is created manually. The tables and indexes are created and managed through `node-pg-migrate`.

After creating the database, configure the database variables in `.env`.

## Database Migrations

This project uses `node-pg-migrate` to manage and version database structure changes.

The migration files are stored in the `migrations/` directory.

The project uses `migrate.config.cjs` to read the PostgreSQL connection values directly from `.env`.

### Migration configuration

The `migrate.config.cjs` file is located in the root of the project:

```text
template-servicios-typescript/
├── migrate.config.cjs
├── package.json
├── .env
└── ...
```

Its configuration is:

```javascript
require("dotenv").config();

module.exports = {
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};
```

This means that the database credentials are not written directly into the migration configuration.

### Run pending migrations

To apply all pending migrations:

```bash
npm run migrate:up
```

This command executes the pending migration files and creates or updates the database structure.

### Roll back the last migration

To reverse the most recently executed migration:

```bash
npm run migrate:down
```

The `down` function defined in the migration is executed to reverse the changes made by the corresponding `up` function.

### Migration workflow

The recommended database setup flow is:

```text
Create PostgreSQL database
        ↓
Configure .env
        ↓
npm run migrate:up
        ↓
Database structure is created
        ↓
Run the seed
        ↓
Default users are created
        ↓
Start the API
```

When changes to the database structure are required, create a new migration instead of modifying the database manually.

## Database Seed

The project includes a seed script to create default users for local development and testing.

The seed is located at:

```text
src/scripts/seed.ts
```

The script creates the following default users:

| Username | Password |
|---|---|
| `admin` | `admin1234` |
| `juan` | `juan1234` |
| `maria` | `maria1234` |
| `paco` | `paco1234` |
| `ana` | `ana1234` |

Passwords are hashed with `bcryptjs` before being stored in PostgreSQL.

The seed also checks usernames using a case-insensitive comparison. If a user already exists, the script skips that user instead of creating a duplicate.

### Run the seed

The seed can be executed after the database migrations have been applied.

Add the following command to the `scripts` section of `package.json`:

```json
"seed": "tsx src/scripts/seed.ts"
```

Then execute:

```bash
npm run seed
```

The expected workflow is:

```text
npm run migrate:up
        ↓
Database tables created
        ↓
npm run seed
        ↓
Default users inserted
```

When the seed is executed again, existing users are skipped.

Example output:

```text
Starting user seeder...

admin created
juan created
maria created
paco created
ana created

Seeder finished.
```

If a user already exists:

```text
Starting user seeder...

admin already exists, skipping
juan already exists, skipping

Seeder finished.
```

The seed is intended for development and testing. Do not use default passwords in a production environment.

## Username Uniqueness

Usernames are handled without distinguishing between uppercase and lowercase letters.

For example:

```text
Luis
luis
LUIS
LuIs
```

are considered the same username.

The database uses a unique index based on `LOWER(username)`:

```sql
CREATE UNIQUE INDEX users_username_lower_unique
ON users (LOWER(username));
```

This prevents duplicate usernames even when the capitalization is different.

## Database Schema

The current migration creates the following tables:

### `users`

Stores registered users and their password hashes.

| Column | Description |
|---|---|
| `id` | User identifier |
| `username` | Username |
| `password_hash` | Encrypted password |
| `created_at` | User creation date |

### `weather_petition`

Stores successful weather queries.

| Column | Description |
|---|---|
| `id` | Query identifier |
| `user_id` | User who performed the query |
| `city_consulted` | City requested |
| `created_at` | Query date |

### `error_log`

Stores errors generated during weather queries.

| Column | Description |
|---|---|
| `id` | Error identifier |
| `user_id` | User who generated the request |
| `city_consulted` | City requested |
| `message_error` | Error message |
| `created_at` | Error date |

## Example Migration

The initial migration creates the three main tables and the case-insensitive username index:

```javascript
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    username: {
      type: "varchar(50)",
      notNull: true,
    },
    password_hash: {
      type: "varchar(255)",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("users", "LOWER(username)", {
    name: "users_username_lower_unique",
    unique: true,
  });

  pgm.createTable("weather_petition", {
    id: "id",
    user_id: {
      type: "integer",
      references: "users",
    },
    city_consulted: {
      type: "varchar(100)",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("error_log", {
    id: "id",
    user_id: {
      type: "integer",
      references: "users",
    },
    city_consulted: {
      type: "varchar(100)",
    },
    message_error: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("now()"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("error_log");
  pgm.dropTable("weather_petition");
  pgm.dropTable("users");
};
```

## Run the Project

Start the Azure Functions application locally:

```bash
npm run start
```

The local API will be available at:

```text
http://localhost:7071
```

## Endpoints

| Method | Route | Description | Requires Token |
|---|---|---|---|
| POST | `/api/auth/registro` | Register a new user | No |
| POST | `/api/auth/login` | Login and obtain a JWT | No |
| GET | `/api/clima/{ciudad}` | Query weather by city | Yes |
| GET | `/api/v1/health` | Check API process status | No |

## Authentication

The weather endpoint requires a valid JWT token.

The token is obtained through:

```http
POST /api/auth/login
```

The token must be sent using the HTTP `Authorization` header:

```http
Authorization: Bearer <token>
```

### Token duration

JWT tokens generated by the API expire after **2 hours**.

## User Registration

### Request

```http
POST /api/auth/registro
```

Request body:

```json
{
  "username": "juan",
  "password": "1234"
}
```

The password must contain at least 4 characters.

The username must be unique without considering uppercase/lowercase differences.

For example, if `juan` already exists, the following usernames cannot be registered:

```text
Juan
JUAN
jUaN
```

### Successful response

```json
{
  "message": "User create"
}
```

## Login

### Request

```http
POST /api/auth/login
```

Request body:

```json
{
  "username": "juan",
  "password": "1234"
}
```

### Successful response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The returned token is used to access protected endpoints.

### Invalid credentials

```json
{
  "error": "Usuario o contraseña incorrectos"
}
```

## Weather Query

The API uses one GET endpoint to query cities:

```http
GET /api/clima/{ciudad}
```

The `pais` query parameter is optional.

### Search by city name

```http
GET /api/clima/Guadalajara
Authorization: Bearer <token>
```

### Search by city and country

A country code can be provided using the `pais` query parameter:

```http
GET /api/clima/Guadalajara?pais=MX
Authorization: Bearer <token>
```

The API internally builds:

```text
Guadalajara,MX
```

The `pais` parameter should use an **ISO 3166-1 alpha-2** country code.

Examples:

```text
MX
ES
US
CA
```

For example:

```http
GET /api/clima/Guadalajara?pais=MX
```

queries Guadalajara, Mexico.

Avoid using full country names such as:

```text
Mexico
España
United States
```

Use the two-letter country code instead.

## Weather Query Database Records

Every successful weather query is stored in the `weather_petition` table.

Example:

```text
user_id: 1
city_consulted: Guadalajara,MX
created_at: 2026-09-22 10:30:00
```

Errors such as a city not being found are stored in the `error_log` table.

Example:

```text
user_id: 1
city_consulted: CiudadInexistente,MX
message_error: Status 404: ciudad no encontrada
created_at: 2026-09-22 10:35:00
```

## API Responses

The following table summarizes the main documented responses:

| Endpoint | Status | Meaning | Example |
|---|---:|---|---|
| `POST /api/auth/registro` | 200 | User created successfully | `{"message":"User create"}` |
| `POST /api/auth/registro` | 400 | Validation error | Response contains an `errores` array generated by Yup |
| `POST /api/auth/login` | 200 | Login successful | `{"token":"<jwt>"}` |
| `POST /api/auth/login` | 401 | Invalid username or password | `{"error":"Usuario o contraseña incorrectos"}` |
| `GET /api/clima/{ciudad}` | 200 | Weather query successful | Weather data returned by OpenWeatherMap |
| `GET /api/clima/{ciudad}` | 401 | Token missing or invalid | `{"error":"Token inválido o ausente"}` |

### Validation error example

When Yup validation fails, the API returns a `400` response containing the validation errors in an `error` array.

Example:

```json
{
  "error": [
    "The user is required"
  ]
}
```

The exact messages depend on the validation rule that fails.

### Login 401 example

```json
{
  "error": "User o password incorrect"
}
```

### Weather 401 example

```json
{
  "error": "Token invalid o asben"
}
```

## Health Check

The API provides a simple health check endpoint:

```http
GET http://localhost:7071/api/v1/health
```

Example response:

```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-09-22T16:00:00.000Z",
  "version": "1.0.0"
}
```

The endpoint verifies that the Azure Functions process is running.

It does not verify the availability of PostgreSQL or OpenWeatherMap.

## Running Tests

The project uses Vitest for unit testing.

Run the complete test suite with:

```bash
npm run test
```

The tests are stored in the `tests/` directory.

The test suite covers the main functions, including registration, login, and weather operations.

## Testing with Postman

### 1. Select the Environment

The requests use Postman environment variables.

Protected requests use:

```text
{{token}}
```

Make sure the correct Environment is selected in Postman before sending requests.

### 2. Register a user

Run:

```http
POST http://localhost:7071/api/auth/registro
```

Body:

```json
{
  "username": "juan",
  "password": "1234"
}
```

### 3. Login

Run:

```http
POST http://localhost:7071/api/auth/login
```

Body:

```json
{
  "username": "juan",
  "password": "1234"
}
```

The login request contains a Postman script that automatically stores the JWT:

```javascript
const answer = pm.response.json();

if (answer.token) {
  pm.environment.set("token", answer.token);
  console.log("automatically saved token");
} else {
  console.log("Login failed; the token was not saved.");
}
```

This means that the token does not need to be copied manually.

### 4. Query the weather

For a protected request, configure:

**Authorization → Bearer Token**

and use:

```text
{{token}}
```

Example:

```http
GET http://localhost:7071/api/clima/Guadalajara
```

### 5. Query a city using a country

Use:

```http
GET http://localhost:7071/api/clima/Guadalajara?pais=MX
```

Or configure the parameter from the **Params** tab:

| KEY | VALUE |
|---|---|
| `pais` | `MX` |

The same JWT stored in `{{token}}` is automatically used for the request.

### Postman flow

The complete authentication flow is:

```text
Login
   ↓
Postman receives JWT
   ↓
Login script stores JWT in Environment variable
   ↓
Environment variable becomes {{token}}
   ↓
Protected requests send Authorization: Bearer {{token}}
```

No manual copy and paste of the JWT is required.

## API Documentation

The complete API specification is available in:

```text
docs/v1.yaml
```

### View Swagger/OpenAPI in VS Code

Open `docs/v1.yaml` with a Swagger/OpenAPI extension for VS Code that can render OpenAPI files.

### View Swagger/OpenAPI with Swagger Editor

The same `docs/v1.yaml` file can also be opened in Swagger Editor by importing the YAML file.

The Swagger/OpenAPI documentation describes:

- Available endpoints
- Parameters
- Authentication requirements
- Request bodies
- Response schemas
- Response examples
- Error responses

## Troubleshooting

### `npm` returns `E401`

If `npm install` fails with an error similar to:

```text
npm error code E401
npm error Unable to authenticate
```

the configured npm registry may require valid credentials or an authentication token.

Check the configured registry and authenticate again when required:

```bash
npm login
```

Also verify that the project is using the correct registry configuration.

### TypeScript error `TS2835`

If TypeScript reports an error similar to:

```text
TS2835: Relative import paths need explicit file extensions
```

check the relative imports in TypeScript files.

For ESM configuration, use the `.js` extension in relative imports when required by the project configuration:

```ts
import { pool } from "../shared/db.js";
```

instead of:

```ts
import { pool } from "../shared/db";
```

### Migration connection error

If `npm run migrate:up` or `npm run migrate:down` cannot connect to PostgreSQL, verify the values in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clima
DB_USER=postgres
DB_PASSWORD=your_password
```

Also verify that the PostgreSQL server is running and that the database exists.

### `{{token}}` is not resolved in Postman

If Postman sends the literal value:

```text
{{token}}
```

check the following:

1. A Postman Environment is selected.
2. The Environment contains a `token` variable.
3. The login request was executed successfully.
4. The login response contains a `token`.
5. The login script executed correctly.

The login script only stores the token when the response contains `respuesta.token`.

### `401` when opening the weather endpoint from a browser

The weather endpoint is protected by JWT authentication.

Opening:

```text
http://localhost:7071/api/clima/Guadalajara
```

directly in the browser does not automatically add:

```http
Authorization: Bearer <token>
```

Therefore, the API can return:

```json
{
  "error": "Token invalid o absent"
}
```

Use Postman or Swagger/OpenAPI with the `Authorization` header configured.

## Author

Francisco Javier Guizar Cortes

fguizar@mikiosko.com.mx