import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "preact/hooks";

/**
 * Show a chart of last 5 splits comparing PB and current run.
 */
export function TimesChart({
  pb,
  current,
}: {
  pb: number[];
  current: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startIndex = Math.max(0, current.length - 5);

  useEffect(() => {
    if (!canvasRef.current) return;

    const style = getComputedStyle(document.documentElement);
    const darken = (color: string, amount = 0.1) =>
      `oklch(from ${color} calc(l - ${amount}) c h)`;
    const setOpacity = (color: string, opacity: number) =>
      `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;

    const opacity = parseFloat(style.getPropertyValue("--chart-opacity")) || 1;
    const currentColor = setOpacity(
      style.getPropertyValue("--chart-current"),
      opacity,
    );
    const pbColor = setOpacity(style.getPropertyValue("--chart-pb"), opacity);

    const rawData = [
      {
        name: "Current Run",
        color: currentColor,
        data: current
          .map((point, idx, arr) => ({
            x: idx.toString(),
            y: idx === 0 ? point : point - arr[idx - 1],
          }))
          .slice(startIndex, startIndex + 5),
      },
      {
        name: "PB",
        color: pbColor,
        data: pb
          .map((point, idx, arr) => ({
            x: idx.toString(),
            y: idx === 0 ? point : point - arr[idx - 1],
          }))
          .slice(startIndex, startIndex + 5),
      },
    ];

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        datasets: [
          ...rawData.map(({ name, color, data }) => ({
            label: name,
            borderColor: darken(color),
            pointBackgroundColor: darken(color),
            clip: 0,
            data,
            borderWidth: 1,
          })),
          ...rawData.map(({ name, color, data }) => ({
            fill: true,
            label: name,
            backgroundColor: color,
            clip: 0,
            data,
          })),
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
  }, [pb, current, startIndex]);

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="300" />
    </div>
  );
}
