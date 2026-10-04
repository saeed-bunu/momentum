export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type Task = {
  id: string;
  text: string;
  resourceKind: "books" | "videos";
  resourceLabel: string;
};

export type Progress = {
  skill: string;
  level: SkillLevel;
  timePerDay: number;
  activeDate: string;
  dailyTaskIds: string[];
  completedTaskIds: string[];
  completionByDate: Record<string, string[]>;
  previousDay?: {
    date: string;
    completedTaskIds: string[];
  };
};

const STORAGE_KEY = "momentum-progress-v1";
const LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced"];

const ROADMAP: Record<SkillLevel, (skill: string) => Task[]> = {
  Beginner: (skill) => [
    { id: "beginner-intro", text: `Read an introduction to ${skill}`, resourceKind: "books", resourceLabel: "Find beginner books" },
    { id: "beginner-tutorial", text: `Watch a beginner ${skill} tutorial`, resourceKind: "videos", resourceLabel: "Watch a beginner tutorial" },
    { id: "beginner-basics", text: `Practice the core basics of ${skill}`, resourceKind: "videos", resourceLabel: "Find beginner practice" },
    { id: "beginner-concepts", text: `Learn the key concepts behind ${skill}`, resourceKind: "books", resourceLabel: `Explore ${skill} books` },
    { id: "beginner-exercises", text: `Complete five beginner ${skill} exercises`, resourceKind: "videos", resourceLabel: "Find beginner exercises" },
    { id: "beginner-project", text: `Build a small ${skill} project`, resourceKind: "videos", resourceLabel: "Find beginner project guides" },
    { id: "beginner-review", text: `Review your ${skill} project and improve one part`, resourceKind: "videos", resourceLabel: "Find project feedback tips" },
    { id: "beginner-explain", text: `Explain one ${skill} concept in your own words`, resourceKind: "books", resourceLabel: "Review learning resources" },
    { id: "beginner-independent", text: `Complete a small ${skill} task without a tutorial`, resourceKind: "videos", resourceLabel: "Find independent practice" },
  ],
  Intermediate: (skill) => [
    { id: "intermediate-project", text: `Build a small ${skill} project from scratch`, resourceKind: "videos", resourceLabel: "Find intermediate project ideas" },
    { id: "intermediate-deep-dive", text: `Study an intermediate ${skill} deep-dive`, resourceKind: "videos", resourceLabel: "Watch an intermediate deep-dive" },
    { id: "intermediate-exercises", text: `Solve three ${skill} practice exercises`, resourceKind: "videos", resourceLabel: "Find intermediate exercises" },
    { id: "intermediate-patterns", text: `Learn a useful ${skill} pattern and apply it`, resourceKind: "books", resourceLabel: `Find ${skill} references` },
    { id: "intermediate-refactor", text: `Improve or refactor part of your ${skill} project`, resourceKind: "videos", resourceLabel: "Explore refactoring techniques" },
    { id: "intermediate-compare", text: `Compare two approaches to a ${skill} problem`, resourceKind: "books", resourceLabel: `Read about ${skill} approaches` },
    { id: "intermediate-build", text: `Build a ${skill} project using a new technique`, resourceKind: "videos", resourceLabel: "Find project walkthroughs" },
    { id: "intermediate-review", text: `Review your ${skill} work and document what changed`, resourceKind: "books", resourceLabel: `Explore ${skill} case studies` },
    { id: "intermediate-teach", text: `Teach one intermediate ${skill} concept to someone`, resourceKind: "videos", resourceLabel: `Find teaching tips for ${skill}` },
  ],
  Advanced: (skill) => [
    { id: "advanced-reading", text: `Read advanced ${skill} articles or papers`, resourceKind: "books", resourceLabel: "Find advanced books" },
    { id: "advanced-feature", text: `Build a complex ${skill} feature end-to-end`, resourceKind: "videos", resourceLabel: "Find advanced architecture videos" },
    { id: "advanced-teach", text: `Teach or write about an advanced ${skill} concept`, resourceKind: "videos", resourceLabel: `Explore advanced ${skill} tutorials` },
    { id: "advanced-architecture", text: `Evaluate an architecture decision in ${skill}`, resourceKind: "books", resourceLabel: `Read advanced ${skill} references` },
    { id: "advanced-benchmark", text: `Measure and improve a ${skill} solution`, resourceKind: "videos", resourceLabel: `Find ${skill} optimization guides` },
    { id: "advanced-case-study", text: `Study a real-world ${skill} case study`, resourceKind: "books", resourceLabel: `Find ${skill} case studies` },
    { id: "advanced-project", text: `Create a substantial ${skill} project with documented tradeoffs`, resourceKind: "videos", resourceLabel: "Find advanced project walkthroughs" },
    { id: "advanced-review", text: `Review current developments in ${skill}`, resourceKind: "books", resourceLabel: `Explore recent ${skill} writing` },
    { id: "advanced-contribution", text: `Contribute a useful improvement in ${skill}`, resourceKind: "videos", resourceLabel: `Find contribution guides for ${skill}` },
  ],
};

export function getRoadmapTasks(skill: string, level: SkillLevel): Task[] {
  return ROADMAP[level](skill.trim());
}

export function getDailyTaskCount(timePerDay: number): number {
  return timePerDay === 15 ? 1 : timePerDay === 30 ? 2 : 3;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createProgress(
  skill: string,
  level: SkillLevel,
  timePerDay: number,
  date = new Date(),
): Progress {
  const dailyTaskCount = getDailyTaskCount(timePerDay);
  const tasks = getRoadmapTasks(skill, level);

  return {
    skill: skill.trim(),
    level,
    timePerDay,
    activeDate: localDateKey(date),
    dailyTaskIds: tasks.slice(0, dailyTaskCount).map((task) => task.id),
    completedTaskIds: [],
    completionByDate: {},
  };
}

export function advanceProgress(progress: Progress, date = new Date()): Progress {
  const nextDate = localDateKey(date);
  if (progress.activeDate === nextDate) {
    return progress;
  }

  const tasks = getRoadmapTasks(progress.skill, progress.level);
  const completed = new Set(progress.completedTaskIds);
  const unfinished = progress.dailyTaskIds.filter((id) => !completed.has(id));
  const assigned = new Set(unfinished);
  const dailyTaskCount = getDailyTaskCount(progress.timePerDay);

  for (const task of tasks) {
    if (assigned.size >= dailyTaskCount) {
      break;
    }
    if (!completed.has(task.id) && !assigned.has(task.id)) {
      unfinished.push(task.id);
      assigned.add(task.id);
    }
  }

  return {
    ...progress,
    activeDate: nextDate,
    dailyTaskIds: unfinished,
    previousDay: {
      date: progress.activeDate,
      completedTaskIds: progress.completionByDate[progress.activeDate] ?? [],
    },
  };
}

export function completeTask(progress: Progress, taskId: string): Progress {
  if (!progress.dailyTaskIds.includes(taskId) || progress.completedTaskIds.includes(taskId)) {
    return progress;
  }

  const completedTaskIds = [...progress.completedTaskIds, taskId];
  const todayCompletions = progress.completionByDate[progress.activeDate] ?? [];

  return {
    ...progress,
    completedTaskIds,
    completionByDate: {
      ...progress.completionByDate,
      [progress.activeDate]: [...todayCompletions, taskId],
    },
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidProgress(value: unknown): value is Progress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Progress>;
  const previousDayIsValid =
    candidate.previousDay === undefined ||
    (typeof candidate.previousDay === "object" &&
      candidate.previousDay !== null &&
      typeof candidate.previousDay.date === "string" &&
      isStringArray(candidate.previousDay.completedTaskIds));

  return (
    typeof candidate.skill === "string" &&
    candidate.skill.trim().length > 0 &&
    LEVELS.includes(candidate.level as SkillLevel) &&
    [15, 30, 60].includes(candidate.timePerDay ?? 0) &&
    typeof candidate.activeDate === "string" &&
    isStringArray(candidate.dailyTaskIds) &&
    isStringArray(candidate.completedTaskIds) &&
    !!candidate.completionByDate &&
    typeof candidate.completionByDate === "object" &&
    Object.values(candidate.completionByDate).every(isStringArray) &&
    previousDayIsValid
  );
}

export function loadProgress(date = new Date()): Progress | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    if (!isValidProgress(parsed)) {
      return null;
    }

    const validTaskIds = new Set(getRoadmapTasks(parsed.skill, parsed.level).map((task) => task.id));
    const isValidTaskId = (id: string) => validTaskIds.has(id);
    const sanitized: Progress = {
      ...parsed,
      dailyTaskIds: parsed.dailyTaskIds.filter(isValidTaskId),
      completedTaskIds: parsed.completedTaskIds.filter(isValidTaskId),
      completionByDate: Object.fromEntries(
        Object.entries(parsed.completionByDate).map(([dateKey, taskIds]) => [
          dateKey,
          taskIds.filter(isValidTaskId),
        ]),
      ),
    };

    return advanceProgress(sanitized, date);
  } catch {
    return null;
  }
}

export function saveProgress(progress: Progress | null): void {
  try {
    if (progress) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}