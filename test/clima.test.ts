import { beforeEach, describe, expect, it, vi } from 'vitest';
import { weather } from '../src/functions/clima.js';
import { pool } from '../src/shared/db.js';
import { verifyToken } from '../src/shared/auth.js';

// ---------------------------------------------------------------------------
// Module mocks
// `vi.mock` replaces the real module with a fake one, so the tests never
// touch a real token, a real database or the real environment variables.
// Vitest hoists these calls to the top of the file before running it.
// ---------------------------------------------------------------------------

/** Fake auth module: `verifyToken` returns whatever each test tells it to. */
vi.mock('../src/shared/auth.js', () => ({
  verifyToken: vi.fn(),
}));

/** Fake database module: `pool.query` records its calls but does not connect to PostgreSQL. */
vi.mock('../src/shared/db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

/** Fake config module: fixed values make the expected URLs predictable. */
vi.mock('../src/shared/config.js', () => ({
  config: {
    weatherApiUrl: 'https://fake-weather-api.test/data/2.5/weather',
    weatherApiKey: 'weather-key',
  },
}));

/**
 * Test suite for the `weather` Azure Function.
 * It checks the four possible paths of the handler: invalid token,
 * city not found, successful lookup and lookup with a country code.
 */
describe('weather', () => {
  /**
   * Builds a fake `HttpRequest` with only the fields `weather` reads.
   *
   * By default it simulates a request to `Guadalajara` with a bearer token
   * and no `pais` query parameter.
   *
   * @param overrides - Fields to replace in the default request
   * (for example, `query` to simulate `?pais=MX`).
   * @returns A partial request cast to `any` so TypeScript accepts it.
   */
  const makeRequest = (overrides: Partial<any> = {}) => ({
    headers: { get: vi.fn().mockReturnValue('Bearer valid-token') },
    params: { ciudad: 'Guadalajara' },
    query: { get: vi.fn().mockReturnValue(null) },
    ...overrides,
  }) as any;

  // Reset every mock before each test so calls from one test
  // never leak into the next one.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: authentication failure
  // -------------------------------------------------------------------------
  it('returns 401 when the JWT is invalid or missing', async () => {
    // Arrange: the token check fails and `fetch` is replaced by a spy.
    vi.mocked(verifyToken).mockReturnValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    // Act: call the handler with a default request.
    const response = await weather(makeRequest(), {} as any);

    // Assert: the handler answers 401 with the expected error message.
    expect(response).toEqual({
      status: 401,
      jsonBody: {
        error: 'Invalid token o absent',
      },
    });

    // Assert: nothing else happened. No weather call and no database write.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 2: the external API cannot find the city
  // -------------------------------------------------------------------------
  it('returns 400 and logs the error when the city is not found', async () => {
    // Arrange: valid user (id 10) and an external API that answers 404.
    vi.mocked(verifyToken).mockReturnValue({ id: 10, username: 'ana' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const response = await weather(makeRequest(), {} as any);

    // Assert: the handler called the weather API with the expected URL.
    expect(fetchMock).toHaveBeenCalledWith(
      'https://fake-weather-api.test/data/2.5/weather?q=Guadalajara&appid=weather-key&units=metric&lang=es'
    );

    // Assert: the failure was saved in `errores_log` with user, city and reason.
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO errores_log (usuario_id, ciudad_consultada, mensaje_error) VALUES ($1, $2, $3)',
      [10, 'Guadalajara', 'Status 404: city no found']
    );

    // Assert: the client receives a 400 with the error message.
    expect(response).toEqual({
      status: 400,
      jsonBody: {
        error: 'city no found',
      },
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: successful lookup
  // -------------------------------------------------------------------------
  it('returns 200 and persists the request when the weather service succeeds', async () => {
    // Arrange: valid user (id 7) and an external API that answers with data.
    vi.mocked(verifyToken).mockReturnValue({ id: 7, username: 'paco' });
    const weatherData = {
      name: 'Guadalajara',
      main: { temp: 24.5, humidity: 55 },
      weather: [{ description: 'nublado' }],
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(weatherData),
    });
    vi.stubGlobal('fetch', fetchMock);

    // Act
    const response = await weather(makeRequest(), {} as any);

    // Assert: the handler called the weather API with the expected URL.
    expect(fetchMock).toHaveBeenCalledWith(
      'https://fake-weather-api.test/data/2.5/weather?q=Guadalajara&appid=weather-key&units=metric&lang=es'
    );

    // Assert: the request was saved in `peticiones_clima` with the user id.
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO peticiones_clima (usuario_id, ciudad_consultada) VALUES ($1, $2)',
      [7, 'Guadalajara']
    );

    // Assert: the client receives the weather data unchanged.
    expect(response).toEqual({
      status: 200,
      jsonBody: weatherData,
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: optional country code
  // -------------------------------------------------------------------------
  it('includes the country code in the query when provided', async () => {
    // Arrange: valid user (id 3) and a successful external API response.
    vi.mocked(verifyToken).mockReturnValue({ id: 3, username: 'luis' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ name: 'Guadalajara' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    // Arrange: simulate `?pais=MX` by overriding `query.get`.
    const request = makeRequest({
      query: { get: vi.fn().mockReturnValue('MX') },
    });

    // Act
    const response = await weather(request, {} as any);

    // Assert: the URL contains "city,country" (Guadalajara,MX).
    expect(fetchMock).toHaveBeenCalledWith(
      'https://fake-weather-api.test/data/2.5/weather?q=Guadalajara,MX&appid=weather-key&units=metric&lang=es'
    );

    // Assert: the saved city also includes the country code.
    expect(pool.query).toHaveBeenCalledWith(
      'INSERT INTO peticiones_clima (usuario_id, ciudad_consultada) VALUES ($1, $2)',
      [3, 'Guadalajara,MX']
    );

    // Assert: the request finished successfully.
    expect(response.status).toBe(200);
  });
});
