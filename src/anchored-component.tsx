import type { ReactNode, RefObject } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";

function useAnchoredWidth(
  selfRef: RefObject<HTMLElement>,
  rightSelector: string,
) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const selfElement = selfRef.current;
    if (!selfElement) return;

    const computeWidth = () => {
      const rightElement = document.querySelector(rightSelector);
      if (rightElement && selfRef.current) {
        setWidth(
          rightElement.getBoundingClientRect().right -
            selfRef.current.getBoundingClientRect().x,
        );
      }
    };

    computeWidth();

    const selfObserver = new ResizeObserver(computeWidth);
    selfObserver.observe(selfElement);

    const rightElement = document.querySelector(rightSelector);
    let rightObserver: ResizeObserver | undefined;
    if (rightElement) {
      rightObserver = new ResizeObserver(computeWidth);
      rightObserver.observe(rightElement);
    }

    return () => {
      selfObserver.disconnect();
      rightObserver?.disconnect();
    };
  }, [selfRef, rightSelector]);

  return width;
}

export function AnchoredComponent({
  children,
  right,
}: {
  children?: ReactNode;
  right: string;
}) {
  const selfRef = useRef<HTMLDivElement>(null);
  const width = useAnchoredWidth(selfRef, right);

  return (
    <div
      ref={selfRef}
      className="absolute overflow-hidden"
      style={{
        width,
      }}
    >
      {children}
    </div>
  );
}
