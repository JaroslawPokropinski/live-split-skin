type LiveSplitEvent = "connected" | "disconnected" | "error" | "data";

type Handler = (data?: string) => void;

export class LiveSplitClient {
  private ws?: WebSocket | null;
  private url: string;
  private handlers = new Map<LiveSplitEvent, Handler[]>();
  private requests = new Map<string, (data: string, error?: string) => void>();

  timeout = 5000;

  constructor(address: string) {
    this.url = address.startsWith("ws") ? address : `ws://${address}/livesplit`;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Connecting to LiveSplit at", this.url);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.emit("connected");
        resolve();
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        this.emit("disconnected");
        this.ws = null;
        this.requests.forEach((foo) => foo("", "WebSocket disconnected"));
        this.requests.clear();
      };

      this.ws.onerror = (e) => {
        this.emit("error", String(e));
        reject(e);
      };

      this.ws.onmessage = (e) => {
        const data = String(e.data);
        this.emit("data", data);

        const dataJson = JSON.parse(data);

        const next = this.requests.get(dataJson.requestId);
        this.requests.delete(dataJson.requestId);

        if (next) {
          next(data);
        }
      };
    });
  }

  destroy() {
    this.ws?.close();
    this.ws = null;
  }

  on(event: LiveSplitEvent, handler: Handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  private emit(event: LiveSplitEvent, data?: string) {
    this.handlers.get(event)?.forEach((h) => h(data));
  }

  private async sendRaw(command: string, params: Record<string, unknown> = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(JSON.stringify({ type: command, ...params }));
  }

  send<T extends string | void>(
    command: string,
    params: Record<string, unknown> = {},
    expectResponse = false,
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    if (!expectResponse) {
      this.sendRaw(command);
      return Promise.resolve() as Promise<T>;
    }

    const requestId = Math.random().toString(36).slice(2);

    return new Promise((resolve, reject) => {
      this.sendRaw(command, { ...params, requestId })
        .then(() => {
          const timer = setTimeout(() => {
            reject(new Error("Timeout"));
          }, this.timeout);

          this.requests.set(requestId, (data, error) => {
            if (timer) {
              clearTimeout(timer);
            }
            if (error) {
              reject(new Error(error));
            } else {
              resolve(data as T);
            }
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  getRunBase() {
    return this.send<string>("getrunbaseinfojson", {}, true).then(
      (data) =>
        JSON.parse(data) as {
          gameTitle: string;
          gameCategory: string;
          currentSplitTime: string;
          currentSplitIndex: number;
        },
    );
  }

  getRun() {
    return this.send<string>("getrunjson", {}, true).then(
      (data) =>
        JSON.parse(data) as {
          gameTitle: string;
          gameCategory: string;
          gameIcon?: string;
          currentSplitTime: string;
          currentSplitIndex: number;
          splits: {
            name: string;
            splitTime: string;
            pbTime: string;
            bestSegmentTime: string;
            delta: string;
            icon?: string;
          }[];
        },
    );
  }

  getIcon(hash: string) {
    return this.send<string>(`geticonjson`, { hash }, true).then((data) => {
      const b64 = JSON.parse(data).base64Icon as string;
      return `data:image/png;base64,${b64}`;
    });
  }
}
