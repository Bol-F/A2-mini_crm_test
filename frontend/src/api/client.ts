import { getCurrentLanguage } from "../i18n";
import type { ApiError } from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiClientError extends Error {
  public readonly status: number | null;
  public readonly data: ApiError | null;

  constructor(
    message: string,
    status: number | null,
    data: ApiError | null = null,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Accept-Language": getCurrentLanguage(),
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError("network_error", null);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiClientError("malformed_response", response.status);
  }

  if (!response.ok) {
    throw new ApiClientError("api_error", response.status, data as ApiError);
  }

  return data as T;
}
