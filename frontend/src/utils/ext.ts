import Cookies from "js-cookie";

const isDevelopment = import.meta.env.DEV;

// Async utilities
export const delay = (ms: number): Promise<void> =>
  new Promise(res => setTimeout(res, ms));

// Data encoding/decoding
export const encodeData = (data: unknown): string => {
  try {
    const jsonString = JSON.stringify(data);
    const bytes = new TextEncoder().encode(jsonString);
    const binString = Array.from(bytes, byte =>
      String.fromCodePoint(byte)
    ).join("");
    return btoa(binString);
  } catch (e) {
    console.error("Failed to encode data:", e);
    throw new Error("Data encoding failed");
  }
};

export const decodeData = <T = unknown>(encoded: string): T | null => {
  try {
    const binString = atob(encoded);
    const bytes = Uint8Array.from(binString, m => m.codePointAt(0)!);
    const jsonString = new TextDecoder().decode(bytes);
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Failed to decode data:", e);
    return null;
  }
};

// Cookie utilities
export const setCookies = (
  keyOrObject: string | Record<string, string>,
  valueOrOptions?: string | Cookies.CookieAttributes | number,
  days?: number
): void => {
  try {
    if (typeof keyOrObject === "string") {
      const key = keyOrObject;
      const value = valueOrOptions as string;

      const options: Cookies.CookieAttributes = {
        path: "/",
        sameSite: "lax",
      };

      if (!isDevelopment && window.location.protocol === "https:") {
        options.secure = true;
      }

      if (typeof days === "number") {
        options.expires = days;
      }

      Cookies.set(key, value, options);

      if (isDevelopment) {
        console.log(`[DEV] Cookie set: ${key} =`, Cookies.get(key));
      }
      return;
    }

    const cookies = keyOrObject;
    const options = (valueOrOptions as Cookies.CookieAttributes) || {};

    Object.entries(cookies).forEach(([key, value]) => {
      const finalOptions: Cookies.CookieAttributes = {
        path: "/",
        sameSite: "lax",
        ...options,
      };

      if (!isDevelopment && window.location.protocol === "https:") {
        finalOptions.secure = true;
      }

      Cookies.set(key, value, finalOptions);

      if (isDevelopment) {
        console.log(`[DEV] Cookie set: ${key} =`, Cookies.get(key));
      }
    });
  } catch (e) {
    console.error("Failed to set cookies:", e);
  }
};

export const getCookies = (
  keys?: string[]
): Record<string, string | undefined> => {
  try {
    if (!keys || keys.length === 0) return Cookies.get();
    const result: Record<string, string | undefined> = {};
    keys.forEach(key => {
      result[key] = Cookies.get(key);
    });
    return result;
  } catch (e) {
    console.error("Failed to get cookies:", e);
    return {};
  }
};

export const removeCookies = (
  keys: string[] = ["accessToken", "user"]
): void => {
  try {
    keys.forEach(key => {
      Cookies.remove(key, { path: "/" });
      if (isDevelopment) {
        console.log(`[DEV] Cookie removed: ${key}`);
      }
    });
  } catch (e) {
    console.error("Failed to remove cookies:", e);
  }
};

// LocalStorage utilities
export const setLocalStorage = (
  keyOrObject: string | Record<string, unknown>,
  value?: unknown
): void => {
  try {
    if (typeof keyOrObject === "string") {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(keyOrObject, serialized);
      if (isDevelopment) {
        console.log(`[DEV] LocalStorage set: ${keyOrObject}`);
      }
    } else {
      Object.entries(keyOrObject).forEach(([key, val]) => {
        const serialized = typeof val === "string" ? val : JSON.stringify(val);
        localStorage.setItem(key, serialized);
        if (isDevelopment) {
          console.log(`[DEV] LocalStorage set: ${key}`);
        }
      });
    }
  } catch (e) {
    console.error("Failed to set localStorage:", e);
  }
};

export const getLocalStorage = <T = unknown>(
  keys?: string[],
  parse = true
): Record<string, T | string | null> => {
  try {
    if (!keys || keys.length === 0) {
      const result: Record<string, T | string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value && parse) {
            try {
              result[key] = JSON.parse(value) as T;
            } catch {
              result[key] = value;
            }
          } else {
            result[key] = value;
          }
        }
      }
      return result;
    }

    const result: Record<string, T | string | null> = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && parse) {
        try {
          result[key] = JSON.parse(value) as T;
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    });
    return result;
  } catch (e) {
    console.error("Failed to get localStorage:", e);
    return {};
  }
};

export const removeLocalStorage = (keys?: string[]): void => {
  try {
    if (!keys || keys.length === 0) {
      localStorage.clear();
      if (isDevelopment) {
        console.log("[DEV] LocalStorage cleared");
      }
    } else {
      keys.forEach(key => {
        localStorage.removeItem(key);
        if (isDevelopment) {
          console.log(`[DEV] LocalStorage removed: ${key}`);
        }
      });
    }
  } catch (e) {
    console.error("Failed to remove from localStorage:", e);
  }
};

// SessionStorage utilities
export const setSessionStorage = (
  keyOrObject: string | Record<string, unknown>,
  value?: unknown
): void => {
  try {
    if (typeof keyOrObject === "string") {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      sessionStorage.setItem(keyOrObject, serialized);
      if (isDevelopment) {
        console.log(`[DEV] SessionStorage set: ${keyOrObject}`);
      }
    } else {
      Object.entries(keyOrObject).forEach(([key, val]) => {
        const serialized = typeof val === "string" ? val : JSON.stringify(val);
        sessionStorage.setItem(key, serialized);
        if (isDevelopment) {
          console.log(`[DEV] SessionStorage set: ${key}`);
        }
      });
    }
  } catch (e) {
    console.error("Failed to set sessionStorage:", e);
  }
};

export const getSessionStorage = <T = unknown>(
  keys?: string[],
  parse = true
): Record<string, T | string | null> => {
  try {
    if (!keys || keys.length === 0) {
      const result: Record<string, T | string | null> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value && parse) {
            try {
              result[key] = JSON.parse(value) as T;
            } catch {
              result[key] = value;
            }
          } else {
            result[key] = value;
          }
        }
      }
      return result;
    }

    const result: Record<string, T | string | null> = {};
    keys.forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value && parse) {
        try {
          result[key] = JSON.parse(value) as T;
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    });
    return result;
  } catch (e) {
    console.error("Failed to get sessionStorage:", e);
    return {};
  }
};

export const removeSessionStorage = (keys?: string[]): void => {
  try {
    if (!keys || keys.length === 0) {
      sessionStorage.clear();
      if (isDevelopment) {
        console.log("[DEV] SessionStorage cleared");
      }
    } else {
      keys.forEach(key => {
        sessionStorage.removeItem(key);
        if (isDevelopment) {
          console.log(`[DEV] SessionStorage removed: ${key}`);
        }
      });
    }
  } catch (e) {
    console.error("Failed to remove from sessionStorage:", e);
  }
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// String utilities
export const truncateString = (
  str: string,
  maxLength: number,
  suffix = "..."
): string => {
  try {
    if (!str) return "";
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
  } catch (e) {
    console.error("Failed to truncate string:", e);
    return str;
  }
};

export const capitalize = (str: string): string => {
  try {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch (e) {
    console.error("Failed to capitalize string:", e);
    return str;
  }
};

export const toTitleCase = (str: string): string => {
  try {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch (e) {
    console.error("Failed to convert to title case:", e);
    return str;
  }
};

// Number utilities
export const formatNumber = (num: number, locale = "en-US"): string => {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch (e) {
    console.error("Failed to format number:", e);
    return String(num);
  }
};

export const formatCurrency = (
  amount: number,
  currency = "USD",
  locale = "en-US"
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch (e) {
    console.error("Failed to format currency:", e);
    return String(amount);
  }
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  try {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  } catch (e) {
    console.error("Failed to shuffle array:", e);
    return array;
  }
};

export const uniqueArray = <T>(array: T[]): T[] => {
  try {
    return Array.from(new Set(array));
  } catch (e) {
    console.error("Failed to get unique array:", e);
    return array;
  }
};

// Date utilities
export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return "";
  }
}

export const getRelativeTime = (date: Date | number): string => {
  try {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const now = Date.now();
    const then = typeof date === "number" ? date : date.getTime();
    const diffInSeconds = Math.floor((then - now) / 1000);

    // Return "just now" for very small differences
    if (Math.abs(diffInSeconds) < 5) {
      return "just now";
    }

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
      ["second", 1],
    ];

    for (const [unit, secondsInUnit] of units) {
      if (Math.abs(diffInSeconds) >= secondsInUnit) {
        const value = Math.floor(diffInSeconds / secondsInUnit);
        return rtf.format(value, unit);
      }
    }

    return rtf.format(0, "second");
  } catch (e) {
    console.error("Failed to get relative time:", e);
    return String(date);
  }
};

/**
 * Generates a cryptographically secure random code verifier
 */
export function generateCodeVerifier(length: number = 128): string {
  try {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const randomValues = new Uint8Array(length);

    window.crypto.getRandomValues(randomValues);

    let codeVerifier = "";
    for (let i = 0; i < length; i++) {
      codeVerifier += characters[randomValues[i] % characters.length];
    }

    return codeVerifier;
  } catch (e) {
    console.error("Failed to generate code verifier:", e);
    throw new Error("Code verifier generation failed");
  }
}

/**
 * Calculates the code challenge from a code verifier using SHA-256
 */
export async function calculateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch (e) {
    console.error("Failed to calculate code challenge:", e);
    throw new Error("Code challenge calculation failed");
  }
}

/**
 * Generates a PKCE pair (verifier and challenge)
 */
export async function generatePKCEPair(length: number = 128): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  try {
    const codeVerifier = generateCodeVerifier(length);
    const codeChallenge = await calculateCodeChallenge(codeVerifier);

    return { codeVerifier, codeChallenge };
  } catch (e) {
    console.error("Failed to generate PKCE pair:", e);
    throw new Error("PKCE pair generation failed");
  }
}

// File Conversion Utilities
// File Conversion Utilities
export function base64ToFile(dataurl: string, filename: string): File {
  try {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "application/octet-stream";
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error("Failed to convert base64 to file:", e);
    throw new Error("Base64 to file conversion failed");
  }
}

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(`${fileReader.result}`);
      };
      fileReader.onerror = error => {
        console.error("Failed to read file:", error);
        reject(error);
      };
    } catch (e) {
      console.error("Failed to convert file to base64:", e);
      reject(e);
    }
  });
}

export function triggerDownload(filename: string, text: string): void {
  try {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  } catch (e) {
    console.error("Failed to trigger download:", e);
  }
}

// CSV Export Helpers
export function escapeCSVValue(value: string): string {
  // Wrap in quotes if contains comma, newline, or quote
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return escapeCSVValue(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value instanceof Date) {
    return escapeCSVValue(value.toISOString());
  }

  if (Array.isArray(value)) {
    return escapeCSVValue(value.join(", "));
  }

  if (typeof value === "object") {
    return escapeCSVValue(JSON.stringify(value));
  }

  return escapeCSVValue(String(value));
}

export function downloadCSV(content: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedFilename = filename
    .replace(/[^a-z0-9-_]/gi, "-")
    .toLowerCase();

  link.setAttribute("href", url);
  link.setAttribute("download", `${sanitizedFilename}-${timestamp}.csv`);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup blob URL to prevent memory leaks
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
