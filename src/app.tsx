import { SplitsTable, type Split } from "./splits-table";
import { TimerDisplay } from "./timer";
import { TimesChart } from "./times-chart";
import { useEffect, useRef, useState } from "preact/hooks";
import { LiveSplitClient } from "./live-split-client";
import { lstimerToSeconds, renderRichHash } from "./utils";

export function IconRenderer({
  img,
  preview,
}: {
  img?: string;
  preview?: string;
}) {
  if (!img && !preview) return null;

  return (
    <img
      src={img ?? preview}
      alt="Game Icon"
      className={`w-full h-full object-contain [transition: filter 1s ease-in-out] ${!img ? "filter-[blur(4px)]" : ""}`}
    />
  );
}

export function App() {
  const [serverUrl] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const port = urlParams.get("port") ?? "16836";
    const ip = urlParams.get("ip") ?? "localhost";
    return `${ip}:${port}`;
  });

  const [client, setClient] = useState<LiveSplitClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [splitsData, setSplitsData] = useState<Split[]>([]);
  const fetchStatusRef = useRef<
    Record<string, "to_fetch" | "fetching" | "fetched">
  >({});

  const [iconHashToB64, setIconHashToBase64] = useState(
    new Map<string, string>(),
  );

  const [runData, setRunData] = useState<{
    gameTitle: string;
    gameCategory: string;
    gameIcon?: string;
    imagePreview?: string;
    currentSplitTime: number;
    delta: number;
  } | null>(null);

  useEffect(() => {
    const newClient = new LiveSplitClient(serverUrl);
    newClient
      .connect()
      .then(() => {
        console.log("Connected to LiveSplit");
        setClient(newClient);
      })
      .catch((err) => {
        console.error("Failed to connect to LiveSplit:", err);
      });

    // Refresh the site when connection fails
    const interval = setInterval(() => {
      if (!newClient.isConnected) {
        console.warn("Connection failed, reloading the page.");
        location.reload();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      newClient.destroy();
    };
  }, [serverUrl]);

  // Check connection status every 30ms
  useEffect(() => {
    if (!client) return;

    const interval = setInterval(() => {
      setIsConnected(client.isConnected);
    }, 30);

    return () => {
      clearInterval(interval);
    };
  }, [client]);

  // Fetch run data
  useEffect(() => {
    if (!client) return;

    (async () => {
      while (true) {
        const data = await client.getRun().catch((err) => {
          console.error("Error fetching run data:", err);
          return null;
        });

        if (!data) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        const currentOrLastSplitIndex = Math.max(
          0,
          Math.min(data.splits.length - 1, data.currentSplitIndex),
        );

        setRunData({
          gameTitle: data.gameTitle,
          gameCategory: data.gameCategory,
          gameIcon: data.gameIcon,
          imagePreview:
            data.gameIcon && renderRichHash(data.gameIcon.split(";")[1]),
          currentSplitTime: lstimerToSeconds(data.currentSplitTime),
          delta: lstimerToSeconds(data.splits[currentOrLastSplitIndex]?.delta),
        });

        const newSplitsData = data.splits.map((split, idx) => {
          const name = split.name.split("|")[0].trim();
          const desc = split.name.split("|")[1]?.trim() ?? "";

          const diff =
            data.currentSplitIndex > idx ? lstimerToSeconds(split.delta) : NaN;

          return {
            id: idx,
            name,
            time: lstimerToSeconds(split.splitTime),
            pb: lstimerToSeconds(split.pbTime),
            bestSegmentTime: lstimerToSeconds(split.bestSegmentTime),
            segmentDelta: lstimerToSeconds(split.segmentDelta),
            diff,
            active: data.currentSplitIndex === idx,
            description: desc,
            icon: split.icon,
            iconPreview: split.icon && renderRichHash(split.icon.split(";")[1]),
          };
        });

        setSplitsData(newSplitsData);

        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    })();
  }, [client]);

  // Update image hashes set
  useEffect(() => {
    if (runData?.gameIcon && !(runData.gameIcon in fetchStatusRef.current)) {
      fetchStatusRef.current[runData.gameIcon] = "to_fetch";
    }

    splitsData.forEach((split) => {
      if (split.icon && !(split.icon in fetchStatusRef.current)) {
        fetchStatusRef.current[split.icon] = "to_fetch";
      }
    });
  }, [runData, splitsData]);

  // Fetch icons
  useEffect(() => {
    if (!client) return;
    if (!isConnected) return;

    const fetchIcons = async () => {
      const newIconHashToB64 = new Map<string, string>();

      await Promise.all(
        Array.from(
          Object.entries(fetchStatusRef.current).filter(
            ([, status]) => status === "to_fetch",
          ),
        )
          // .slice(0, 1)
          .map(async ([iconHash]) => {
            fetchStatusRef.current[iconHash] = "fetching";
            try {
              const b64 = await client.getIcon(iconHash);
              if (b64) {
                newIconHashToB64.set(iconHash, b64);
              }
            } catch (err) {
              console.error(`Failed to fetch icon for hash ${iconHash}:`, err);
            }
          }),
      );

      setIconHashToBase64((prev) => new Map([...prev, ...newIconHashToB64]));
    };

    const interval = setInterval(fetchIcons, 5000); // Fetch icons every 5 seconds
    setTimeout(fetchIcons, 0);

    return () => {
      clearInterval(interval);
    };
  }, [client, isConnected]);

  return (
    <>
      <div className="h-screen p-2 flex items-center justify-center">
        <div className="w-full bg-card rounded-2xl border border-border overflow-hidden shadow-lg/50 h-full flex flex-col">
          {/* Connection Status (shows blinking red dot when not connected) */}
          {!isConnected && (
            <div className="relative">
              <div className="absolute top-6 right-4 flex items-center gap-1 animate-pulse">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </div>
            </div>
          )}
          {/* Header */}
          <div className="p-6 flex items-center gap-4 border-b border-border/50">
            <div className="h-14">
              <IconRenderer
                img={runData?.gameIcon && iconHashToB64.get(runData.gameIcon)}
                preview={runData?.imagePreview}
              />
            </div>

            <div className="h-14">
              <h1 className="text-xl font-semibold text-foreground">
                {runData?.gameTitle ?? ""}
              </h1>
              <p className="text-muted-foreground text-sm">
                {runData?.gameCategory ?? ""}
              </p>
            </div>
          </div>

          <SplitsTable splits={splitsData} iconsMap={iconHashToB64} />

          <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <TimerDisplay
                time={runData?.currentSplitTime}
                diff={runData?.delta}
              />
            </div>

            <TimesChart
              pb={splitsData.map((split) => split.pb)}
              current={splitsData
                .map((split) => split.time)
                .filter((time) => !Number.isNaN(time))}
            />
          </div>

          {/* <StatsFooter
            bestPossible="17:18"
            previousSegment={{ diff: -6.8, best: 8.2 }}
            sumOfBest="16:54"
            possibleSave="7.21"
          /> */}
        </div>
      </div>
    </>
  );
}
