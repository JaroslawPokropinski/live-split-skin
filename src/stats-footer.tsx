export function StatsFooter({
  bestPossible,
  previousSegment,
  sumOfBest,
  possibleSave,
}: {
  bestPossible: string;
  previousSegment: { diff: number; best: number };
  sumOfBest: string;
  possibleSave: string;
}) {
  return (
    <div className="px-6 pb-6">
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/30 pt-6">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Best Possible Time
          </p>
          <p className="text-foreground font-mono font-medium text-base mt-1">
            {bestPossible}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Previous Segment
          </p>
          <p className="font-mono font-medium text-base mt-1">
            <span>
              {previousSegment.diff > 0 ? "+" : ""}
              {previousSegment.diff}
            </span>
            <span className="text-muted-foreground/50"> / </span>
            <span className="text-foreground/70">{previousSegment.best}</span>
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Sum of Best Segments
          </p>
          <p className="text-foreground font-mono font-medium text-base mt-1">
            {sumOfBest}
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Possible Time Save
          </p>
          <p className="text-foreground font-mono font-medium text-base mt-1">
            {possibleSave}
          </p>
        </div>
      </div>
    </div>
  );
}
