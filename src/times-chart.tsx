import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "preact/hooks";

/**
 * Show a chart of last 5 splits comparing PB and current run.
 *
 * Chart colors are driven by CSS custom properties so users can override them
 * in their own stylesheet:
 *   --chart-current-r / --chart-current-g / --chart-current-b  (current run line)
 *   --chart-pb-r     / --chart-pb-g     / --chart-pb-b      (PB line)
 *
 * Alternatively, pass explicit `color` / `pbColor` props to override per-instance.
 */
export function TimesChart({
  pb,
  current,
  color: colorProp,
  pbColor: pbColorProp,
}: {
  pb: number[];
  current: number[];
  color?: { r: number; g: number; b: number };
  pbColor?: { r: number; g: number; b: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startIndex = Math.max(0, current.length - 5);

  useEffect(() => {
    if (!canvasRef.current) return;

    const style = getComputedStyle(document.documentElement);
    const parse = (prefix: string) => ({
      r: parseInt(style.getPropertyValue(`--${prefix}-r`).trim()) || 0,
      g: parseInt(style.getPropertyValue(`--${prefix}-g`).trim()) || 0,
      b: parseInt(style.getPropertyValue(`--${prefix}-b`).trim()) || 0,
    });

    const color = colorProp ?? parse("chart-current");
    const pbColor = pbColorProp ?? parse("chart-pb");

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        datasets: [
          {
            fill: true,
            label: "PB",
            backgroundColor: `rgba(${pbColor.r}, ${pbColor.g}, ${pbColor.b}, 0.2)`,
            borderColor: `rgba(${pbColor.r}, ${pbColor.g}, ${pbColor.b}, 1)`,
            pointBackgroundColor: `rgba(${pbColor.r}, ${pbColor.g}, ${pbColor.b}, 1)`,
            clip: 0,
            data: pb
              .map((point, idx, arr) => ({
                x: idx.toString(),
                y: idx === 0 ? point : point - arr[idx - 1],
              }))
              .slice(startIndex, startIndex + 5),
            borderWidth: 1,
          },
          {
            fill: true,
            label: "Current Run",
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`,
            borderColor: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
            pointBackgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
            clip: 0,
            data: current
              .map((point, idx, arr) => ({
                x: idx.toString(),
                y: idx === 0 ? point : point - arr[idx - 1],
              }))
              .slice(startIndex, startIndex + 5),
            borderWidth: 1,
          },
        ],
      },
      options: {
        elements: {
          line: {
            tension: 0.3,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
            beginAtZero: true,
          },
        },
        layout: {
          autoPadding: false,
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [pb, colorProp, pbColorProp, current, startIndex]);

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="300" />
    </div>
  );
}
