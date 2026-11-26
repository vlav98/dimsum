import { chmodSync, mkdirSync } from "node:fs";
import session from "express-session";
import createFileStore from "session-file-store";

export class DashboardSessionStore extends session.Store {
  private readonly store: session.Store;
  private readonly pending = new Map<string, Promise<void>>();
  private readonly destroyed = new Map<string, number>();

  constructor(
    directory: string,
    private readonly ttlSeconds: number,
  ) {
    super();
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    chmodSync(directory, 0o700);
    const FileStore = createFileStore(session);
    this.store = new FileStore({
      path: directory,
      ttl: ttlSeconds,
      retries: 0,
    });
  }

  private enqueue<T>(id: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.pending.get(id) ?? Promise.resolve();
    const result = previous.then(operation);
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    this.pending.set(id, settled);
    void settled.then(() => {
      if (this.pending.get(id) === settled) this.pending.delete(id);
    });
    return result;
  }

  get(
    id: string,
    callback: (error: unknown, data?: session.SessionData | null) => void,
  ): void {
    void this.enqueue(
      id,
      () =>
        new Promise<session.SessionData | null | undefined>((resolve, reject) =>
          this.store.get(id, (error, data) =>
            error ? reject(error) : resolve(data),
          ),
        ),
    ).then(
      (data) => callback(null, data),
      (error: unknown) => callback(error),
    );
  }

  set(
    id: string,
    data: session.SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.enqueue(id, () => {
      if (this.destroyed.has(id)) {
        return Promise.reject(
          new Error("Cannot write a destroyed dashboard session."),
        );
      }
      return new Promise<void>((resolve, reject) =>
        this.store.set(id, data, (error: unknown) =>
          error ? reject(error) : resolve(),
        ),
      );
    }).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }

  touch(
    id: string,
    data: session.SessionData,
    callback?: (error?: unknown) => void,
  ): void {
    void this.enqueue(
      id,
      () =>
        new Promise<void>((resolve, reject) =>
          this.store.touch!(id, data, (error?: unknown) =>
            error ? reject(error) : resolve(),
          ),
        ),
    ).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }

  destroy(id: string, callback?: (error?: unknown) => void): void {
    const now = Date.now();
    for (const [sessionId, expiresAt] of this.destroyed) {
      if (expiresAt <= now) this.destroyed.delete(sessionId);
    }
    this.destroyed.set(id, now + this.ttlSeconds * 1000);
    void this.enqueue(
      id,
      () =>
        new Promise<void>((resolve, reject) =>
          this.store.destroy(id, (error: unknown) =>
            error ? reject(error) : resolve(),
          ),
        ),
    ).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }
}
