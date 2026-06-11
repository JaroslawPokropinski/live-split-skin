import { useRef, useState, useEffect } from "preact/hooks";
import { useElementSize } from "./use-element-size";

export function ResponsiveText2({
  text,
  padding = 8,
}: {
  text: string;
  padding?: number;
}) {
  console.log("Rendering ResponsiveText");
  const selfRef = useRef<HTMLDivElement>(null);
  const preferredFontSizeRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [fontSize, setFontSize] = useState(0);

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
    }, 200);

    return () => clearInterval(interval);
  }, [padding]);

  // Adjust font size based on width
  useEffect(() => {
    if (!preferredFontSizeRef.current) return;

    const preferredFontSize = parseFloat(
      window.getComputedStyle(preferredFontSizeRef.current).fontSize,
    );

    setFontSize(
      Math.min(
        preferredFontSize,
        preferredFontSize * (width / preferredFontSizeRef.current.scrollWidth),
      ),
    );
  }, [text, width, padding]);

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
          height: 0,
        }}
      >
        {text}
      </div>

      <div className="overflow-clip" style={{ fontSize }}>
        {text}
      </div>
    </div>
  );
}

export function ResponsiveText({
  className = "",
  text,
  padding = 8,
}: {
  className?: string;
  text: string;
  padding?: number;
}) {
  const selfRef = useRef<HTMLDivElement>(null);
  const preferredFontSizeRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(0);
  const { width: rectWidth } = useElementSize(selfRef);

  // Adjust font size based on width
  useEffect(() => {
    if (!preferredFontSizeRef.current || !selfRef.current) return;

    const style = window.getComputedStyle(selfRef.current);
    const width =
      rectWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      parseFloat(style.borderLeft) -
      parseFloat(style.borderRight);

    const preferredFontSize = parseFloat(
      window.getComputedStyle(preferredFontSizeRef.current).fontSize,
    );

    setFontSize(
      Math.min(
        preferredFontSize,
        preferredFontSize * (width / preferredFontSizeRef.current.scrollWidth),
      ),
    );
  }, [text, padding, rectWidth]);

  return (
    <div ref={selfRef} className={className}>
      <div
        ref={preferredFontSizeRef}
        className="overflow-x-visible overflow-y-hidden"
        style={{
          height: 0,
        }}
      >
        {text}
      </div>

      <div className="overflow-clip" style={{ fontSize }}>
        {text}
      </div>
    </div>
  );
}
