import { beforeEach, describe, expect, it, vi } from "vitest";
import { weather } from "../src/functions/clima.ts";
import { pool } from "../src/shared/db.ts";
import { verifyToken } from "../src/shared/auth.ts";

vi.mock("../src/shared/auth.ts");
vi.mock("../src/shared/db.ts");
vi.mock("../src/shared/config.ts", () => ({
  config: {
    weatherApiUrl:
      "https://fake-weather-api.test/data/2.5/weather",
    weatherApiKey: "weather-key",
  },
}));

describe("weather", () => {
  const makeRequest = (
    ciudad: string | null = "Guadalajara",
    pais: string | null = null
  ) => ({
    query: {
      get: vi.fn((parameter: string) => {
        if (parameter === "ciudad") {
          return ciudad;
        }

        if (parameter === "pais") {
          return pais;
        }

        return null;
      }),
    },
  }) as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the JWT is invalid or missing", async () => {
    vi.mocked(verifyToken).mockReturnValue(null);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await weather(
      makeRequest(),
      {} as any
    );

    expect(response).toEqual({
      status: 401,
      jsonBody: {
        error: "Invalid token or absent",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("returns 400 when ciudad is not provided", async () => {
    vi.mocked(verifyToken).mockReturnValue({
      id: 10,
      username: "pancho",
    });

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await weather(
      makeRequest(null),
      {} as any
    );

    expect(response).toEqual({
      status: 400,
      jsonBody: {
        error: 'The "ciudad" query parameter is required.',
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("returns 400 and logs the error when the city is not found", async () => {
    vi.mocked(verifyToken).mockReturnValue({
      id: 10,
      username: "pancho",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await weather(
      makeRequest("Guadalajara"),
      {} as any
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://fake-weather-api.test/data/2.5/weather?q=Guadalajara&appid=weather-key&units=metric&lang=es"
    );

    
    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO error_log (user_id, city_consulted, message_error) VALUES ($1, $2, $3)",
      [10, "Guadalajara", "Status 404: city not found"]
    );

    expect(response).toEqual({
      status: 400,
      jsonBody: {
        error: "city not found",
      },
    });
  });

  it("returns 200 and persists the request when the weather service succeeds", async () => {
    vi.mocked(verifyToken).mockReturnValue({
      id: 7,
      username: "pancho",
    });

    const weatherData = {
      name: "Guadalajara",
      main: {
        temp: 24.5,
        humidity: 55,
      },
      weather: [
        {
          description: "nublado",
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(weatherData),
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await weather(
      makeRequest("Guadalajara"),
      {} as any
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://fake-weather-api.test/data/2.5/weather?q=Guadalajara&appid=weather-key&units=metric&lang=es"
    );

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO weather_petition (user_id, city_consulted) VALUES ($1, $2)",
      [7, "Guadalajara"]
    );

    expect(response).toEqual({
      status: 200,
      jsonBody: weatherData,
    });
  });

  it("includes the country code when pais is provided", async () => {
    vi.mocked(verifyToken).mockReturnValue({
      id: 3,
      username: "luis",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        name: "Guadalajara",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await weather(
      makeRequest("Guadalajara", "MX"),
      {} as any
    );

 
    expect(fetchMock).toHaveBeenCalledWith(
      "https://fake-weather-api.test/data/2.5/weather?q=Guadalajara%2CMX&appid=weather-key&units=metric&lang=es"
    );

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO weather_petition (user_id, city_consulted) VALUES ($1, $2)",
      [3, "Guadalajara,MX"]
    );

    expect(response.status).toBe(200);
  });
});