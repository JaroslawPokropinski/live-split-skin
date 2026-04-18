import { secondsToTimeString } from "./utils";

export function TimerDisplay({
  time,
  diff,
}: {
  time: number | undefined;
  diff: number | undefined;
}) {
  if (time === undefined) {
    return <div />;
  }

  const timeString = secondsToTimeString(time, 3);
  const seconds = timeString.split(".")[0];
  const milliseconds = timeString.split(".")[1];

  return (
    <div className="px-6 py-8 text-center flex drop-shadow-md">
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
        <div className="relative">
          <div
            className={`text-3xl font-bold font-mono absolute h-full left-2 flex items-center ${diff < 0 ? "text-green-400" : "text-red-400"}`}
          >
            <span>
              {diff > 0 ? "+" : ""}
              {secondsToTimeString(diff, 1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
