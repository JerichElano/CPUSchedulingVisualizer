export type ProcessInput = {
  job?: string;
  arrival: number;
  burst: number;
  priority: number;
};

export type ProcessResult = Required<ProcessInput> & {
  waiting: number;
  turnaround: number;
  completion: number;
};

export type TimelineSegment = {
  job: string;
  start: number;
  end: number;
};

export type SimulationResult = {
  processes: ProcessResult[];
  timeline: TimelineSegment[];
  averages: {
    waiting: number;
    turnaround: number;
  };
};

export class ValidationError extends Error {}

const normalizeProcesses = (processes: ProcessInput[]): Required<ProcessInput>[] => {
  if (!Array.isArray(processes) || !processes.length) {
    throw new ValidationError("Provide at least one process.");
  }

  const normalized: Required<ProcessInput>[] = [];
  const seen = new Set<string>();

  processes.forEach((proc, index) => {
    const job = (proc.job ?? `P${index + 1}`).trim() || `P${index + 1}`;

    if (seen.has(job)) {
      throw new ValidationError(`Duplicate job '${job}'.`);
    }
    seen.add(job);

    const arrival = Number(proc.arrival);
    const burst = Number(proc.burst);
    const priority = Number(proc.priority);

    if (
      Number.isNaN(arrival) ||
      Number.isNaN(burst) ||
      Number.isNaN(priority) ||
      !Number.isFinite(arrival) ||
      !Number.isFinite(burst) ||
      !Number.isFinite(priority)
    ) {
      throw new ValidationError(`Arrival, burst, and priority must be numbers for '${job}'.`);
    }

    if (arrival < 0 || burst <= 0) {
      throw new ValidationError(`Arrival must be >= 0 and burst > 0 for '${job}'.`);
    }

    normalized.push({
      job,
      arrival: Math.floor(arrival),
      burst: Math.floor(burst),
      priority: Math.floor(priority),
    });
  });

  return normalized;
};

export const nonPreemptivePriority = (processes: ProcessInput[]): SimulationResult => {
  const normalized = normalizeProcesses(processes);
  const n = normalized.length;
  const completed = new Set<number>();
  let current = Math.min(...normalized.map((p) => p.arrival));

  const results: ProcessResult[] = [];
  const timeline: TimelineSegment[] = [];

  while (completed.size < n) {
    const available = normalized
      .map((proc, idx) => ({ proc, idx }))
      .filter(({ idx, proc }) => !completed.has(idx) && proc.arrival <= current);

    if (!available.length) {
      const nextArrival = Math.min(
        ...normalized.filter((_, idx) => !completed.has(idx)).map((p) => p.arrival),
      );
      current = Math.max(current, nextArrival);
      continue;
    }

    const next = available.reduce((best, candidate) => {
      const bestKey = [best.proc.priority, best.proc.burst, best.proc.arrival];
      const candKey = [candidate.proc.priority, candidate.proc.burst, candidate.proc.arrival];

      for (let i = 0; i < bestKey.length; i += 1) {
        if (candKey[i] === bestKey[i]) continue;
        return candKey[i] < bestKey[i] ? candidate : best;
      }
      return best;
    });

    const waiting = current - next.proc.arrival;
    const turnaround = waiting + next.proc.burst;
    const completion = current + next.proc.burst;

    results.push({
      ...next.proc,
      waiting,
      turnaround,
      completion,
    });

    timeline.push({ job: next.proc.job, start: current, end: completion });
    current = completion;
    completed.add(next.idx);
  }

  const averages = results.reduce(
    (acc, proc) => {
      acc.waiting += proc.waiting;
      acc.turnaround += proc.turnaround;
      return acc;
    },
    { waiting: 0, turnaround: 0 },
  );

  return {
    processes: normalized.map((proc) => results.find((res) => res.job === proc.job)!),
    timeline,
    averages: {
      waiting: Number((averages.waiting / n).toFixed(2)),
      turnaround: Number((averages.turnaround / n).toFixed(2)),
    },
  };
};



