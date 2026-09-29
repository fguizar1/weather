import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { pool } from "../src/shared/db.js";
import { generateToken } from "../src/shared/auth.js";
import { login } from "../src/functions/login.js";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("../src/shared/db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("../src/shared/auth.js", () => ({
  generateToken: vi.fn(),
}));

describe("login", () => {
  const makeRequest = (body: { username: string; password: string }) =>
    ({ json: vi.fn().mockResolvedValue(body) } as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and a JWT when credentials are valid", async () => {
    vi.mocked(pool.query).mockResolvedValue({
      rows: [{ id: 1, username: 'paco', password_hash: "hashed_password" }],
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(generateToken).mockReturnValue("fake-jwt-token");

    const response = await login(
      makeRequest({ username: "paco", password: "1234" }),
      {} as any
    );

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM usuarios WHERE LOWER(username) = LOWER($1)",
      ["paco"]
    );
    expect(bcrypt.compare).toHaveBeenCalledWith("1234", "hashed_password");
    expect(generateToken).toHaveBeenCalledWith({
      id: 1,
      username: "paco",
    });

    expect(response).toEqual({
      status: 200,
      jsonBody: {
        token: "fake-jwt-token",
      },
    });
  });

  it("returns 401 when the user does not exist", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);

    const response = await login(
      makeRequest({ username: "noexiste", password: "1234" }),
      {} as any
    );

    expect(response).toEqual({
      status: 401,
      jsonBody: {
        error: "User o password incorrect",
      },
    });
  });

  it("returns 401 when the password is incorrect", async () => {
    vi.mocked(pool.query).mockResolvedValue({
      rows: [{ id: 2, username: "paco", password_hash: "hashed_password" }],
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const response = await login(
      makeRequest({ username: "paco", password: "wrong-password" }),
      {} as any
    );

    expect(bcrypt.compare).toHaveBeenCalledWith("wrong-password", "hashed_password");
    expect(response).toEqual({
      status: 401,
      jsonBody: {
        error: "User o password incorrect",
      },
    });
  });

  it("does not compare passwords when the user does not exist", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);

    await login(
      makeRequest({ username: "missing-user", password: "1234" }),
      {} as any
    );

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("does not generate a token when the password is invalid", async () => {
    vi.mocked(pool.query).mockResolvedValue({
      rows: [{ id: 3, username: "paco", password_hash: "hashed_password" }],
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await login(
      makeRequest({ username: "paco", password: "bad-password" }),
      {} as any
    );

    expect(bcrypt.compare).toHaveBeenCalledWith("bad-password", "hashed_password");
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("throws when the database query fails", async () => {
    vi.mocked(pool.query).mockRejectedValue(new Error("DB error"));

    await expect(
      login(
        makeRequest({ username: "paco", password: "1234" }),
        {} as any
      )
    ).rejects.toThrow("DB error");

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(generateToken).not.toHaveBeenCalled();
  });
});