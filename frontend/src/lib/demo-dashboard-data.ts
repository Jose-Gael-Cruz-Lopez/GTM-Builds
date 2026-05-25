import type {
  ChurnRiskResponse,
  ClientsAnalyticsResponse,
  PeakHoursResponse,
  RetentionResponse,
  VisitsResponse,
} from "@/lib/api/analytics";
import type { StatsSummary } from "@/lib/api/businesses";

const NOW = new Date();

function isoDaysAgo(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildVisitSeries(days: number): { labels: string[]; values: number[] } {
  const labels: string[] = [];
  const values: number[] = [];
  const weekdayBoost = [0.85, 0.9, 1.0, 1.05, 1.15, 1.25, 1.1];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(NOW);
    date.setDate(date.getDate() - i);
    labels.push(date.toISOString().slice(0, 10));
    const dow = date.getDay();
    const base = 11 + (dow === 5 || dow === 6 ? 4 : 0);
    const wave = Math.sin(i / 2.8) * 2.5;
    const jitter = ((i * 17 + dow * 3) % 5) - 2;
    values.push(Math.max(6, Math.round(base + wave + jitter * weekdayBoost[dow])));
  }

  return { labels, values };
}

function rollingAvg(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10;
  });
}

export const DEMO_STATS: StatsSummary = {
  totalClients: 127,
  activeClients: 84,
  atRiskClients: 28,
  lostClients: 15,
  visitsToday: 14,
  activeCampaigns: 1,
  generatedAt: NOW.toISOString(),
};

export function getDemoVisits(days: number): VisitsResponse {
  const { labels, values } = buildVisitSeries(days);
  const totalVisits = values.reduce((a, b) => a + b, 0);

  return {
    labels,
    values,
    rollingAvg: rollingAvg(values),
    totalVisits,
    avgPerDay: Math.round((totalVisits / days) * 10) / 10,
    period: `${days}d`,
    generatedAt: NOW.toISOString(),
  };
}

export const DEMO_CLIENTS: ClientsAnalyticsResponse = {
  total: 127,
  newLast30Days: 23,
  newLast7Days: 6,
  returning: 98,
  singleVisit: 29,
  breakdown: {
    labels: ["active", "at_risk", "lost"],
    values: [84, 28, 15],
  },
  generatedAt: NOW.toISOString(),
};

export const DEMO_RETENTION: RetentionResponse = {
  totalClients: 127,
  windows: [
    { days: 30, label: "Last 30 days", clientCount: 127, retentionRate: 71 },
    { days: 60, label: "Last 60 days", clientCount: 118, retentionRate: 62 },
    { days: 90, label: "Last 90 days", clientCount: 104, retentionRate: 54 },
  ],
  statusBreakdown: { active: 84, atRisk: 28, lost: 15 },
  generatedAt: NOW.toISOString(),
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
});

function buildPeakGrid(): number[][] {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayLabels.map((_, dayIdx) =>
    HOUR_LABELS.map((_, hour) => {
      const isWeekend = dayIdx === 0 || dayIdx === 6;
      const morning = hour >= 8 && hour <= 11 ? (isWeekend ? 5 : 4) : 0;
      const afternoon = hour >= 16 && hour <= 19 ? (dayIdx === 5 || dayIdx === 6 ? 6 : 4) : 0;
      const lunch = hour >= 13 && hour <= 14 ? 2 : 0;
      const base = hour >= 7 && hour <= 20 ? 1 : 0;
      const noise = (dayIdx + hour) % 3;
      return morning + afternoon + lunch + base + noise;
    }),
  );
}

const DEMO_GRID = buildPeakGrid();

export const DEMO_PEAK_HOURS: PeakHoursResponse = {
  grid: DEMO_GRID,
  dayLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  hourLabels: HOUR_LABELS,
  peak: { day: "Sat", hour: "5pm", visitCount: 12 },
  totalVisitsAnalyzed: 412,
  generatedAt: NOW.toISOString(),
};

export const DEMO_CHURN: ChurnRiskResponse = {
  clients: [
    {
      clientId: "demo-1",
      fullName: "María G.",
      phone: "•••• 4821",
      email: null,
      status: "at_risk",
      daysSinceVisit: 22,
      lastVisitAt: isoDaysAgo(22),
      totalVisits: 7,
      riskScore: 78,
    },
    {
      clientId: "demo-2",
      fullName: "Carlos R.",
      phone: "•••• 9034",
      email: null,
      status: "at_risk",
      daysSinceVisit: 19,
      lastVisitAt: isoDaysAgo(19),
      totalVisits: 5,
      riskScore: 72,
    },
    {
      clientId: "demo-3",
      fullName: "Ana L.",
      phone: "•••• 1156",
      email: null,
      status: "lost",
      daysSinceVisit: 45,
      lastVisitAt: isoDaysAgo(45),
      totalVisits: 3,
      riskScore: 91,
    },
    {
      clientId: "demo-4",
      fullName: "Diego M.",
      phone: "•••• 6672",
      email: null,
      status: "at_risk",
      daysSinceVisit: 16,
      lastVisitAt: isoDaysAgo(16),
      totalVisits: 9,
      riskScore: 65,
    },
    {
      clientId: "demo-5",
      fullName: "Lucía P.",
      phone: "•••• 3389",
      email: null,
      status: "active",
      daysSinceVisit: 4,
      lastVisitAt: isoDaysAgo(4),
      totalVisits: 11,
      riskScore: 28,
    },
  ],
  counts: { highRisk: 2, mediumRisk: 2, earlyRisk: 1 },
  generatedAt: NOW.toISOString(),
};

export const DEMO_REWARDS_30D = 23;
