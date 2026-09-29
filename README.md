# Weather Query API with JWT Authentication

API built with Azure Functions (Node.js/TypeScript) that allows users to register, log in, and query the weather of cities using JWT authentication.

The API uses PostgreSQL to store users, successful weather queries, and errors. Each weather query and error is associated with the authenticated user who generated it.

The API also supports city searches using an optional country code, allowing the same endpoint to query a city by name only or by city name and country.

## Features

- User registration with password hashing using bcryptjs
- User login with JWT token generation
- Weather queries protected by JWT authentication
- Input validation using Yup
- Case-insensitive unique usernames
- PostgreSQL database integration
- Database record of every successful weather query in `peticiones_clima`
- Database record of weather errors in `errores_log`
- City search by name
- City search by name and country code
- Database migrations using `node-pg-migrate`
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
| pg | PostgreSQL client |
| pgAdmin4 | Database management |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| Yup | Input validation |
| OpenWeatherMap | Weather data |
| node-pg-migrate | Database migrations |
| dotenv | Environment variables |
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
│   └── shared/
│       ├── config.js
│       ├── db.js
│       └── auth.js
├── tests/
│   ├── registro.test.ts
│   ├── login.test.ts
│   └── clima.test.ts
├── migrations/
├── docs/
│   ├── v1.yaml
├── local.settings.json
├── package.json
└── README.md
```

The exact filenames can vary depending on the current project version, but the main organization is based on `src/functions`, `src/shared`, `tests`, `migrations`, and `docs`.

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

The project uses environment variables for the database, JWT, and OpenWeatherMap configuration.

### 3. Create the `.env` file

The `.env` file contains the database configuration and the connection string used by the migration system:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clima
DB_USER=postgres
DB_PASSWORD=your_password

DATABASE_URL=postgres://postgres:your_password@localhost:5432/clima

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
| `DATABASE_URL` | PostgreSQL connection string used by migrations |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `WEATHER_API_KEY` | OpenWeatherMap API key |

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

### 4. Create the database

From pgAdmin4, create the PostgreSQL database:

```sql
CREATE DATABASE clima;
```

Connect to the `clima` database and create the required tables:

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE peticiones_clima (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    ciudad_consultada VARCHAR(100),
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE errores_log (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    ciudad_consultada VARCHAR(100),
    mensaje_error TEXT,
    fecha TIMESTAMP DEFAULT NOW()
);
```

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

A PostgreSQL unique index is used to enforce this rule:

```sql
CREATE UNIQUE INDEX usuarios_username_lower_unique
ON usuarios (LOWER(username));
```

This prevents duplicate usernames even if the capitalization is different.

The application also normalizes usernames using lowercase before storing them in the database.

## Database Migrations

This project uses `node-pg-migrate` to manage database structure changes.

### Configure the database connection

The `.env` file contains the database configuration and the connection string used by the migration system:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clima
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgres://postgres:your_password@localhost:5432/clima
JWT_SECRET=your-secret-key
WEATHER_API_KEY=your-openweathermap-api-key
```

### Create a migration

```bash
npm run migrate:create -- migration-name
```

Example:

```bash
npm run migrate:create -- add-username-index
```

### Run migrations

```bash
npm run migrate:up
```

### Roll back the last migration

```bash
npm run migrate:down
```

If all migrations have already been executed, the command returns:

```text
No migrations to run!

Migrations complete!
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

The username must also be unique without considering uppercase/lowercase differences.

For example, if `juan` already exists, the following usernames cannot be registered:

```text
Juan
JUAN
jUaN
```

### Successful response

```json
{
  "mensaje": "Usuario creado"
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

The `pais` parameter should use an **ISO 3166-1 alpha-2** country code, using two letters.

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

queries Guadalajara, Mexico, while:

```http
GET /api/clima/Guadalajara?pais=ES
```

queries Guadalajara, Spain.

Avoid using full country names such as:

```text
Mexico
España
United States
```

Use the two-letter country code instead.

## Weather Query Database Records

Every successful weather query is stored in the `peticiones_clima` table.

Example:

```text
usuario_id: 1
ciudad_consultada: Guadalajara,MX
fecha: 2026-09-22 10:30:00
```

Errors such as a city not being found are stored in the `errores_log` table.

Example:

```text
usuario_id: 1
ciudad_consultada: CiudadInexistente,MX
mensaje_error: Status 404: city no found
fecha: 2026-09-22 10:35:00
```

## API Responses

The following table summarizes the main documented responses:

| Endpoint | Status | Meaning | Example |
|---|---:|---|---|
| `POST /api/auth/registro` | 200 | User created successfully | `{"mensaje":"Usuario creado"}` |
| `POST /api/auth/registro` | 400 | Validation error | Response contains an `errores` array generated by Yup |
| `POST /api/auth/login` | 200 | Login successful | `{"token":"<jwt>"}` |
| `POST /api/auth/login` | 401 | Invalid username or password | `{"error":"Usuario o contraseña incorrectos"}` |
| `GET /api/clima/{ciudad}` | 200 | Weather query successful | Weather data returned by OpenWeatherMap |
| `GET /api/clima/{ciudad}` | 401 | Token missing or invalid | `{"error":"Token inválido o ausente"}` |

### Validation error example

When Yup validation fails, the API returns a `400` response containing the validation errors in an `errores` array.

Example:

```json
{
  "errores": [
    "El usuario es requerido"
  ]
}
```

The exact messages depend on the validation rule that fails.

### Login 401 example

```json
{
  "error": "Usuario o contraseña incorrectos"
}
```

### Weather 401 example

```json
{
  "error": "Token inválido o ausente"
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

A Postman collection should be stored in the `docs/` directory so the complete API can be imported without creating every request manually.

Recommended location:

```text
docs/postman/
```

### 1. Import the collection

Import the exported Postman collection from the `docs/postman/` directory.

### 2. Select the Environment

The requests use Postman environment variables.

The protected requests use:

```text
{{token}}
```

Make sure the correct Environment is selected in Postman before sending requests.

### 3. Register a user

Create or run:

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

### 4. Login

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
const respuesta = pm.response.json();

if (respuesta.token) {
    pm.environment.set("token", respuesta.token);
    console.log("Token guardado automáticamente:", respuesta.token);
} else {
    console.log("Login falló, no se guardó token");
}
```

This means the token does not need to be copied manually.

### 5. Query the weather

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

The selected Environment provides the value stored in `token`.

### 6. Query a city using a country

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

### npm returns `E401`

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
  "error": "Token inválido o ausente"
}
```

Use Postman or Swagger/OpenAPI with the `Authorization` header configured.

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

## Author

Francisco Javier Guizar Cortes

fguizar@mikiosko.com.mx
