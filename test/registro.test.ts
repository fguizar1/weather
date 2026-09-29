import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { pool } from "../src/shared/db.js";
import { record } from "../src/functions/registro.js";

//cuando record es llamado, se debe de llamar a pool.query para verificar si el usuario ya existe y luego para insertar el nuevo usuario

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

// no se concecta realmente a unsa base de datos, sino que se simula el comportamiento de pool.query para devolver resultados predefinidos
vi.mock("../src/shared/db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe("record", () => {
  const makeRequest = (body: { username: string; password: string }) =>
    ({ json: vi.fn().mockResolvedValue(body) } as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 when the user is created successfully", async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    vi.mocked(bcrypt.hash).mockResolvedValue("hashed_password" as never);

    const response = await record(
      makeRequest({ username: "paco", password: "1234" }),
      {} as any
    );

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      "SELECT id FROM usuarios WHERE LOWER(username) = LOWER($1)",
      ["paco"]
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("1234", 10);

    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO usuarios (username, password_hash) VALUES ($1, $2)",
      ["paco", "hashed_password"]
    );

    expect(response).toEqual({
      status: 201,
      jsonBody: {
        message: "User create",
      },
    });
  });

  it("returns 400 when the input data fails validation", async () => {
    const response = await record(
      makeRequest({ username: "ab", password: "12" }),
      {} as any
    );

    expect(pool.query).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();

    expect(response).toMatchObject({
      status: 400,
      jsonBody: {
        errores: expect.any(Array),
      },
    });

    expect((response as any).jsonBody.errores[0]).toContain("4");
  });

  it("returns 400 when the user already exists", async () => {
    vi.mocked(pool.query).mockResolvedValue({
      rows: [{ id: 1 }],
    } as any);

    const response = await record(
      makeRequest({ username: "paco", password: "1234" }),
      {} as any
    );

    expect(bcrypt.hash).not.toHaveBeenCalled();

    expect(response).toEqual({
      status: 400,
      jsonBody: {
        error: "The user already exist",
      },
    });
  });

  it("throws when the database query fails", async () => {
    vi.mocked(pool.query).mockRejectedValue(new Error("DB error"));

    await expect(
      record(
        makeRequest({ username: "paco", password: "1234" }),
        {} as any
      )
    ).rejects.toThrow("DB error");

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
});