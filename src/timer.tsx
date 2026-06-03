import { ResponsiveText } from "./responsive-text";
import { secondsToTimeString } from "./utils";

export function TimerDisplay({
  time,
  diff,
}: {
  time: number | undefined | null;
  diff: number | undefined;
}) {
  if (time === undefined || time === null) {
    return null;
  }

  const timeString = secondsToTimeString(time, 3);
  const seconds = timeString.split(".")[0];
  const milliseconds = timeString.split(".")[1];

  return (
    <div
      className="w-full flex drop-shadow-md items-center justify-center"
      data-anchor="right"
    >
      <div className="flex items-baseline justify-center">
        <span className="text-6xl font-bold font-mono text-primary tracking-tight">
          {seconds}
        </span>
        {milliseconds !== undefined && (
          <span className="text-3xl font-bold font-mono text-primary/70">
            .{milliseconds}
          </span>
        )}
      </div>

      {diff !== undefined && !Number.isNaN(diff) && (
        <div className="relative" data-anchor="left">
          <div
            className={`text-3xl font-bold font-mono absolute h-full flex items-center ${diff < 0 ? "text-ahead" : "text-behind"}`}
          >
            <ResponsiveText
              text={`${diff > 0 ? "+" : ""}${secondsToTimeString(diff, 1)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
