import { SplitsTable, type Split } from "./splits-table";
import { TimerDisplay } from "./timer";
import { TimesChart } from "./times-chart";
import { useEffect, useState } from "preact/hooks";
import { LiveSplitClient } from "./live-split-client";
import { lstimerToSeconds, setAnimationLoop, setSafeInterval } from "./utils";
import { IconRenderer, ImageProvider } from "./icon-renderer";

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
  const [runTime, setRunTime] = useState<number | null>(null);

  const [runData, setRunData] = useState<{
    gameTitle: string;
    gameCategory: string;
    gameIcon?: string;
    delta: number;
    columns: string[];
  } | null>(null);

  // Initialize LiveSplit client and handle connection
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

    return setSafeInterval(async () => {
      if (!client.isConnected) return;

      const data = await client.getRun().catch((err) => {
        console.error("Error fetching run data:", err);
        return null;
      });

      if (!data) {
        return;
      }

      const currentOrLastSplitIndex = Math.max(
        0,
        Math.min(data.splits.length - 1, data.currentSplitIndex),
      );

      setRunData({
        gameTitle: data.gameTitle,
        gameCategory: data.gameCategory,
        gameIcon: data.gameIcon,
        delta: lstimerToSeconds(data.splits[currentOrLastSplitIndex]?.delta),
        columns: data.columns,
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
          labels: split.labels ?? {},
        };
      });

      setSplitsData(newSplitsData);
    }, 100);
  }, [client]);

  // Fetch run time
  useEffect(() => {
    if (!client) return;

    return setAnimationLoop(() => {
      client
        .getRunTime()
        .then((time) => {
          setRunTime(lstimerToSeconds(time));
        })
        .catch((err) => {
          console.error("Error fetching run time:", err);
          setRunTime(null);
        });
    });
  }, [client]);

  if (!client || !runData) {
    return null;
  }

  return (
    <ImageProvider fetchImage={(hash) => client.getIcon(hash)}>
      <div className="h-screen p-2 flex items-center justify-center">
        <div className="w-full bg-card rounded-2xl border border-border overflow-hidden shadow-lg/50 h-full flex flex-col">
          {/* Connection Status (shows blinking red dot when not connected) */}
          {!isConnected && (
            <div className="relative">
              <div className="absolute top-6 right-4 flex items-center gap-1 animate-pulse">
                <div
                  className="w-3 h-3 rounded-full"
                  style="background-color: var(--color-connection-lost)"
                />
              </div>
            </div>
          )}
          {/* Header */}
          <div className="p-6 flex items-center gap-4 border-b border-border/50">
            <div className="h-14">
              {runData.gameIcon && <IconRenderer imgHash={runData.gameIcon} />}
            </div>

            <div className="h-14">
              <h1 className="text-xl font-semibold text-foreground">
                {runData.gameTitle ?? ""}
              </h1>
              <p className="text-muted-foreground text-sm">
                {runData.gameCategory ?? ""}
              </p>
            </div>
          </div>

          <SplitsTable splits={splitsData} columns={runData.columns} />

          <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <TimerDisplay time={runTime} diff={runData.delta} />
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
    </ImageProvider>
  );
}
