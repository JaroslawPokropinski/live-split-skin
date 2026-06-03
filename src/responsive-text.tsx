import { useRef, useState, useEffect } from "preact/hooks";

export function ResponsiveText({
  text,
  preferredFontSize = 30,
  padding = 8,
}: {
  text: string;
  preferredFontSize?: number;
  padding?: number;
}) {
  const selfRef = useRef<HTMLDivElement>(null);
  const preferredFontSizeRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fontSize, setFontSize] = useState(preferredFontSize);

  // Get width on interval (to account for dynamic changes such as font loading in)
  useEffect(() => {
    const interval = setInterval(() => {
      const rightElement = document.querySelector("[data-anchor='right']");
      if (rightElement && selfRef.current) {
        setWidth(
          rightElement.getBoundingClientRect().right -
            selfRef.current.getBoundingClientRect().x -
            padding,
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, [padding]);

  // Adjust font size based on width
  useEffect(() => {
    if (!preferredFontSizeRef.current) return;

    console.log(
      `Adjusting font size: preferredFontSize=${preferredFontSize}, width=${width}, textWidth=${preferredFontSizeRef.current.offsetWidth}, calculatedFontSize=${preferredFontSize * (width / preferredFontSizeRef.current.offsetWidth)}`,
    );

    setFontSize(
      Math.min(
        preferredFontSize,
        preferredFontSize * (width / preferredFontSizeRef.current.scrollWidth),
      ),
    );
  }, [text, width, preferredFontSize, padding]);

  return (
    <div
      ref={selfRef}
      className="absolute"
      style={{
        left: padding,
        width,
        overflow: "hidden",
      }}
    >
      <div
        ref={preferredFontSizeRef}
        className="overflow-x-visible overflow-y-hidden"
        style={{
          fontSize: `${preferredFontSize}px`,
          height: 0,
        }}
      >
        {text}
      </div>

      <div className="overflow-clip" style={{ fontSize: `${fontSize}px` }}>
        {text}
      </div>
    </div>
  );
}
