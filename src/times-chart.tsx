import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "preact/hooks";

const DEFAULT_COLOR = { r: 99, g: 132, b: 255 };
const DEFAULT_PB_COLOR = { r: 75, g: 192, b: 192 };

/**
 * Show a chart of last 5 splits comparing PB and current run.
 */
export function TimesChart({
  pb,
  current,
  color = DEFAULT_COLOR,
  pbColor = DEFAULT_PB_COLOR,
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

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        datasets: [
          {
            fill: true,
            label: "Current Run",
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
  }, [pb, color, current, pbColor.r, pbColor.g, pbColor.b, startIndex]);

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="300" />
    </div>
  );
}
