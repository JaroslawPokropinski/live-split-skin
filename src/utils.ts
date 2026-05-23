export function lstimerToSeconds(lstimer: string, fract = true): number {
  const parts = lstimer.split(":").map((el) => Number(el.replace(/\..*/, "")));
  const sign = lstimer.trim().startsWith("-") ? -1 : 1;

  const milisStr = lstimer.split(".")[1] || "0";
  const milis = Number(milisStr) / Math.pow(10, milisStr.length);

  return (
    parts.reduce((total, part) => total * 60 + part, 0) * sign +
    (fract ? milis * sign : 0)
  );
}

export function secondsToTimeString(seconds: number, fractPlaces = 0): string {
  if (Number.isNaN(seconds)) return "-";

  const sign = seconds < 0 ? "-" : "";
  seconds = Math.abs(seconds);

  const milis = Math.floor((seconds % 1) * Math.pow(10, fractPlaces))
    .toString()
    .padStart(fractPlaces, "0");
  seconds = Math.floor(seconds);

  let timeString = "";

  while (seconds >= 60) {
    const part = seconds % 60;
    timeString = `:${String(part).padStart(2, "0")}${timeString}`;
    seconds = Math.floor(seconds / 60);
  }

  timeString =
    sign + seconds + timeString + (fractPlaces > 0 ? `.${milis}` : "");

  return timeString;
}

export function renderRichHash(hash: string, scale: number = 32): string {
  const hashBase64 = hash.split(";")[1];
  try {
    const bytes = Uint8Array.from(atob(hashBase64), (c) => c.charCodeAt(0));

    if (bytes.length !== 132) {
      throw new Error(
        `Invalid hash length: expected 132 bytes, got ${bytes.length}`,
      );
    }

    // --- read float32 (little endian) ---
    const view = new DataView(bytes.buffer);
    let aspect = view.getFloat32(128, true);

    // safety clamp
    if (!isFinite(aspect) || aspect <= 0) aspect = 1;

    const baseSize = 8;

    const canvas = document.createElement("canvas");
    canvas.width = baseSize * scale;
    canvas.height = canvas.width / aspect;

    const ctx = canvas.getContext("2d")!;

    const small = document.createElement("canvas");
    small.width = 8;
    small.height = 8;
    const sctx = small.getContext("2d")!;

    const imgData = sctx.createImageData(8, 8);

    for (let i = 0; i < 64; i++) {
      const hi = bytes[i * 2];
      const lo = bytes[i * 2 + 1];
      const packed = (hi << 8) | lo;

      const r = (packed >> 12) & 0xf;
      const g = (packed >> 8) & 0xf;
      const b = (packed >> 4) & 0xf;
      const a = packed & 0xf;

      const idx = i * 4;

      // 4-bit → 8-bit
      imgData.data[idx] = r * 17;
      imgData.data[idx + 1] = g * 17;
      imgData.data[idx + 2] = b * 17;
      imgData.data[idx + 3] = a * 17;
    }

    sctx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Error rendering icon hash:", err);
    return "";
  }
}

/**
 * Create a safe interval by creating timeouts that reschedule themselves, so at most one callback can be running at a time.
 * Returns a function to clear the interval.
 * Callback function will be called immediately on setup, and then after each interval.
 */
export function setSafeInterval(
  callback: () => void | Promise<void>,
  interval: number,
  minDelay: number = 0,
): () => void {
  let previousEndTime: number = 0;
  let isRunning = true;

  const tick = async () => {
    if (!isRunning) return;

    try {
      await callback();
    } catch (err) {
      console.error("Error in setSafeInterval callback:", err);
    }

    const delay = Math.max(minDelay, interval - (Date.now() - previousEndTime));
    previousEndTime = Date.now();

    window.setTimeout(tick, delay);
  };

  tick();

  return () => {
    isRunning = false;
  };
}

export function setAnimationLoop(callback: () => void): () => void {
  let isRunning = true;

  const loop = () => {
    if (!isRunning) return;

    callback();
    requestAnimationFrame(loop);
  };

  loop();

  return () => {
    isRunning = false;
  };
}
