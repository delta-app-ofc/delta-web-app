import type { MonitoringHourlyPoint } from "../../types/indicators";
import "../../pages/leaks/style.css";

interface LeakHourlyChartProps {
  points: MonitoringHourlyPoint[];
}

interface HourSlot {
  key: string;
  label: string;
}

function lastDaySlots(points: MonitoringHourlyPoint[]): HourSlot[] {
  const sortedKeys = points.map((point) => point.readingHour.slice(0, 13)).sort();
  const latestKey = sortedKeys[sortedKeys.length - 1];
  if (!latestKey) return [];
  const [date, hour] = latestKey.split("T");
  if (!date || !hour) return [];
  const latest = new Date(`${date}T${hour}:00:00Z`);
  if (Number.isNaN(latest.getTime())) return [];

  return Array.from({ length: 24 }, (_unused, offset) => {
    const slot = new Date(latest);
    slot.setUTCHours(slot.getUTCHours() - 23 + offset);
    const key = slot.toISOString().slice(0, 13);
    return { key, label: `${key.slice(11, 13)}h` };
  });
}

export function LeakHourlyChart({ points }: LeakHourlyChartProps) {
  const slots = lastDaySlots(points);
  const pointsByHour = new Map(points.map((point) => [point.readingHour.slice(0, 13), point]));
  const flows = points.map((point) => point.avgFlowLmin).filter((flow): flow is number => flow !== null && Number.isFinite(flow));
  const maxFlow = Math.max(0, ...flows);

  if (slots.length === 0 || points.length === 0) {
    return <p className="leak-hourly__message" role="status">Sem leituras horárias para esta instalação nas últimas 24 horas.</p>;
  }

  return (
    <figure className="leak-hourly" aria-labelledby="leak-hourly-title">
      <figcaption id="leak-hourly-title">Vazão média por hora · últimas 24 horas</figcaption>
      <div className="leak-hourly__viewport">
        <div className="leak-hourly__chart" role="list" aria-label="Vazão média por hora em litros por minuto">
          {slots.map((slot) => {
            const point = pointsByHour.get(slot.key);
            const flow = point?.avgFlowLmin ?? null;
            const height = flow === null ? 0 : maxFlow <= 0 ? 3 : Math.max(3, flow / maxFlow * 100);
            const description = flow === null
              ? `${slot.label}: sem leitura de vazão`
              : `${slot.label}: ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(flow)} litros por minuto`;
            return (
              <div className={`leak-hourly__column ${flow === null ? "leak-hourly__column--empty" : ""}`} role="listitem" aria-label={description} title={description} key={slot.key}>
                <div className="leak-hourly__track" aria-hidden="true"><span style={{ height: `${height}%` }} /></div>
                <small>{slot.label}</small>
              </div>
            );
          })}
        </div>
      </div>
      <p className="leak-hourly__unit">L/min · espaços sem barra indicam horas sem leitura</p>
    </figure>
  );
}
