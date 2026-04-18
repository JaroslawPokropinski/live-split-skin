import { useEffect, useRef } from "preact/hooks";
import { secondsToTimeString } from "./utils";
import { IconRenderer } from "./app";

export interface Split {
  id: number;
  name: string;
  description: string;
  time: number;
  pb: number;
  diff: number;
  icon?: string;
  iconPreview?: string;
  active?: boolean;
}

export function SplitsTable({
  splits,
  iconsMap,
}: {
  splits: Split[];
  iconsMap: Map<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll active split into view
  useEffect(() => {
    let activeSplit: HTMLDivElement | null = null;

    const interval = setInterval(() => {
      activeSplit = (containerRef.current?.querySelector(
        "[data-split-active='true']",
      ) ??
        containerRef.current?.querySelector(
          "[data-split-active]",
        )) as HTMLDivElement | null;
    }, 100);

    // Scroll with animation with a speed of s
    const minSpeed = 0.5; // pixels per millisecond
    const maxSpeed = 2; // pixels per millisecond

    let anim: number;
    let prevTime = performance.now();

    const step = () => {
      if (!activeSplit || !containerRef.current) {
        anim = requestAnimationFrame(step);
        return;
      }

      const container = containerRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = activeSplit.getBoundingClientRect();

      const currentScroll = container.scrollTop;

      // position of element inside the scroll container
      const elementOffset = elementRect.top - containerRect.top;

      const targetScroll =
        currentScroll +
        elementOffset -
        container.clientHeight / 2 +
        elementRect.height / 2;

      const distance = targetScroll - currentScroll;

      const now = performance.now();
      const elapsed = now - prevTime;
      prevTime = now;

      const speed = Math.min(
        maxSpeed,
        Math.max(minSpeed, Math.abs(distance) / 100),
      );

      const scrollAbsAmount = speed * elapsed;

      if (Math.abs(distance) < scrollAbsAmount) {
        container.scrollTo({ top: targetScroll });
        anim = requestAnimationFrame(step);
        return;
      }

      const scrollAmount = Math.sign(distance) * scrollAbsAmount;

      container.scrollTop += scrollAmount;

      anim = requestAnimationFrame(step);
    };

    anim = requestAnimationFrame(step);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(anim);
    };
  }, []);

  return (
    <div className="px-2 grow shrink h-0 flex flex-col">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 mx-2 py-3 text-sm text-muted-foreground border-b border-border/30">
        <div>Split</div>
        {/* <div className="w-16 text-center">Time</div> */}
        <div className="w-16 text-center">PB</div>
        <div className="w-16 text-center">+/-</div>
      </div>
      <div ref={containerRef} className="shrink overflow-y-auto no-scrollbar">
        {splits.map((split) => (
          <div
            data-split-active={!!split.active}
            key={split.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-2 py-3 items-center border-b border-border/20 transition-colors ${split.active ? "bg-secondary/50" : ""}`}
          >
            <div className="min-h-11 flex items-center gap-3">
              {
                <div className="h-11 rounded-xl shrink-0">
                  <IconRenderer
                    img={split.icon && iconsMap.get(split.icon)}
                    preview={split.iconPreview}
                  />
                </div>
              }

              <div className="min-w-0">
                <p className="text-foreground font-medium truncate">
                  {split.name}
                </p>
                <p className="text-muted-foreground text-sm truncate">
                  {split.description}
                </p>
              </div>
            </div>
            {/* <div className="w-16 text-center font-mono text-foreground">
              {split.time}
            </div> */}
            <div className="w-16 text-center font-mono text-muted-foreground">
              {secondsToTimeString(
                Number.isNaN(split.pb) ? split.time : split.pb,
              )}
            </div>
            <div className="w-16 text-center font-mono font-medium">
              {split.diff > 0 ? "+" : ""}
              {secondsToTimeString(split.diff)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
