/**
 * Log d'erreurs structuré (JSON une ligne) — lisible dans les logs Vercel
 * et directement exploitable par un collecteur externe (Sentry, Axiom...).
 *
 * On ne logge jamais le corps d'une requête : il contient des données
 * personnelles (email, téléphone) et parfois des secrets.
 */

type Level = "error" | "warn" | "info";

export interface LogContext {
  route?: string;
  action?: string;
  ref?: string;
  slug?: string;
  status?: number;
  [key: string]: unknown;
}

function emit(level: Level, message: string, context: LogContext = {}, err?: unknown) {
  const entry: Record<string, unknown> = {
    level,
    message,
    ts: new Date().toISOString(),
    ...context,
  };

  if (err instanceof Error) {
    entry.error = err.message;
    entry.errorName = err.name;
    if (process.env.NODE_ENV !== "production") entry.stack = err.stack;
  } else if (err !== undefined) {
    entry.error = String(err);
  }

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  error: (message: string, context?: LogContext, err?: unknown) => emit("error", message, context, err),
  warn: (message: string, context?: LogContext, err?: unknown) => emit("warn", message, context, err),
  info: (message: string, context?: LogContext) => emit("info", message, context),
};
