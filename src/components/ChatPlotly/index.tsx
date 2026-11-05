import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

import { useTheme } from "../../contexts/ThemeContext";
import type { ChatPlotlyProps } from "../../types/ai";

const Plot = createPlotlyComponent(Plotly);

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function formatTimestamp(value: unknown): unknown {
  if (!isTimestamp(value)) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export default function ChatPlotly({ figure }: ChatPlotlyProps) {
  const { theme } = useTheme();
  const foreground = theme === "light" ? "#263850" : "#e8edf5";
  const muted = theme === "light" ? "#53647a" : "#9aacc7";
  const grid = theme === "light" ? "rgba(83,100,122,.18)" : "rgba(157,189,255,.14)";
  const sourceLayout = figure.layout;
  const rawTitle = sourceLayout.title;
  const chartTitle = typeof rawTitle === "object" && rawTitle !== null && "text" in rawTitle && typeof rawTitle.text === "string"
    ? rawTitle.text
    : "Gráfico da resposta";
  const hasTimestampBars = figure.data.some((trace) => trace.type === "bar"
    && Array.isArray(trace.x)
    && trace.x.length > 0
    && trace.x.every((value: unknown) => isTimestamp(value)));
  const data = figure.data.map((trace) => {
    if (!hasTimestampBars || trace.type !== "bar" || !Array.isArray(trace.x)) return trace;
    return { ...trace, x: trace.x.map((value: unknown) => formatTimestamp(value)) };
  });
  const layout = {
    ...sourceLayout,
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    barmode: "group",
    bargap: 0.28,
    font: { color: foreground, family: "Google Sans Flex, sans-serif", size: 12 },
    title: { ...(typeof rawTitle === "object" && rawTitle ? rawTitle : {}), x: 0.04, xanchor: "left", font: { color: foreground, size: 15 } },
    xaxis: {
      ...(typeof sourceLayout.xaxis === "object" && sourceLayout.xaxis ? sourceLayout.xaxis : {}),
      ...(hasTimestampBars ? { type: "category", tickangle: 0, nticks: 8 } : {}),
      automargin: true,
      gridcolor: grid,
      color: muted,
      tickfont: { color: muted, size: 10 },
      zerolinecolor: grid,
    },
    yaxis: {
      ...(typeof sourceLayout.yaxis === "object" && sourceLayout.yaxis ? sourceLayout.yaxis : {}),
      automargin: true,
      gridcolor: grid,
      color: muted,
      tickfont: { color: muted, size: 10 },
      zerolinecolor: grid,
    },
    margin: { l: 52, r: 16, t: 54, b: 48 },
  };

  return (
    <figure className="chatbot-chart" role="img" aria-label={chartTitle}>
      <figcaption className="sr-only">{chartTitle}</figcaption>
      <Plot
        data={data}
        layout={layout}
        config={{ responsive: true, displaylogo: false, displayModeBar: false }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </figure>
  );
}
