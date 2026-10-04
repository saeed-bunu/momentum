import { useEffect, useState } from "react";
import QuestionStep from "./QuestionStep";
import {
  advanceProgress,
  completeTask,
  createProgress,
  getRoadmapTasks,
  loadProgress,
  saveProgress,
  type Progress,
  type SkillLevel,
} from "./progress";
import {
  findBooks,
  getYouTubeSearchUrl,
  type Book,
} from "./recommendations";

type ResourceStatus = "loading" | "ready" | "empty" | "error";

function App() {
  const [initialProgress] = useState(() => loadProgress());
  const [progress, setProgress] = useState<Progress | null>(initialProgress);
  const [step, setStep] = useState(initialProgress ? 5 : 1);
  const [skillInput, setSkillInput] = useState(initialProgress?.skill ?? "");
  const [draftLevel, setDraftLevel] = useState<SkillLevel>(initialProgress?.level ?? "Beginner");
  const [draftTime, setDraftTime] = useState(initialProgress?.timePerDay ?? 15);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookStatus, setBookStatus] = useState<ResourceStatus>("loading");

  const skill = progress?.skill ?? skillInput.trim();
  const level = progress?.level ?? draftLevel;
  const timePerDay = progress?.timePerDay ?? draftTime;

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!progress) {
      return;
    }
    setProgress((current) => current && advanceProgress(current));
  }, [progress]);

  useEffect(() => {
    if (step !== 5 || !progress) {
      return;
    }

    const controller = new AbortController();
    setBooks([]);
    setBookStatus("loading");
    findBooks(skill, level, controller.signal)
      .then((results) => {
        setBooks(results);
        setBookStatus(results.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setBookStatus("error");
        }
      });

    return () => controller.abort();
  }, [step, progress, skill, level]);

  const tasks = progress ? getRoadmapTasks(skill, level) : [];
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const todayTaskIds = progress?.dailyTaskIds ?? [];
  const todayTasks = todayTaskIds.flatMap((taskId) => {
    const task = tasksById.get(taskId);
    return task ? [task] : [];
  });
  const completedIds = new Set(progress?.completedTaskIds ?? []);
  const completedTodayIds = progress?.completionByDate[progress.activeDate] ?? [];
  const completedToday = completedTodayIds.flatMap((taskId) => {
    const task = tasksById.get(taskId);
    return task ? [task] : [];
  });
  const nextTask = todayTasks.find((task) => !completedIds.has(task.id));
  const isDayComplete = todayTasks.length > 0 && !nextTask;
  const completedTask = completedTaskId ? tasksById.get(completedTaskId) : undefined;
  const overallPercent = tasks.length
    ? Math.round((completedIds.size / tasks.length) * 100)
    : 0;

  function resetPlan() {
    setProgress(null);
    setSkillInput("");
    setDraftLevel("Beginner");
    setDraftTime(15);
    setCompletedTaskId(null);
    setStep(1);
  }

  function renderDayRecap(showProgressButton = false) {
    return (
      <div className="recap">
        <div className="celebration" aria-hidden="true">*</div>
        <p className="progress-label">Day complete</p>
        <h1>Look what you did</h1>
        <p>You completed {completedToday.length} {completedToday.length === 1 ? "task" : "tasks"} in {skill} today.</p>
        <ul className="task-list recap-list">
          {completedToday.map((task) => <li key={task.id}>{task.text}</li>)}
        </ul>
        <p className="recap-note">A little progress, kept consistently, adds up.</p>
        {showProgressButton && (
          <button className="button button-secondary" onClick={() => setStep(5)}>
            View your progress
          </button>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="app">
        <div className="card">
          <h1>Momentum</h1>
          <p>Build skills. Stay consistent.</p>
          <button className="button" onClick={() => setStep(2)}>Get Started</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="app">
        <div className="card">
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: "33%" }} /></div>
          <h1>What skill do you want to learn?</h1>
          <input
            className="input"
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            placeholder="eg. Coding, Sales, Marketing..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && skillInput.trim()) setStep(3);
            }}
          />
          <button className="button" onClick={() => setStep(3)} disabled={!skillInput.trim()}>Next</button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <QuestionStep
        progress={66}
        stepLabel="Step 2 of 3"
        question={`What's your current level in ${skillInput}?`}
        options={[
          { label: "Beginner", value: "Beginner" },
          { label: "Intermediate", value: "Intermediate" },
          { label: "Advanced", value: "Advanced" },
        ]}
        onSelect={(value) => {
          setDraftLevel(String(value) as SkillLevel);
          setStep(4);
        }}
      />
    );
  }

  if (step === 4) {
    return (
      <QuestionStep
        stepLabel="Step 3 of 3"
        progress={100}
        question="How much time can you commit per day?"
        options={[
          { label: "15 minutes", value: 15 },
          { label: "30 minutes", value: 30 },
          { label: "1 hour", value: 60 },
        ]}
        onSelect={(value) => {
          setDraftTime(Number(value));
          const newProgress = createProgress(skillInput, draftLevel, Number(value));
          setProgress(newProgress);
          setStep(5);
        }}
      />
    );
  }

  if ((step === 5 || step === 6) && progress) {
    const phase = level === "Beginner" ? "Foundations" : level === "Intermediate" ? "Building Skills" : "Mastery";

    if (isDayComplete && step === 6) {
      return <div className="app"><div className="card">{renderDayRecap(true)}</div></div>;
    }

    if (step === 6 && completedTaskId && completedTask) {
      const resourceUrl = completedTask.resourceKind === "books"
        ? books[0] ? `https://openlibrary.org${books[0].key}` : `https://openlibrary.org/search?q=${encodeURIComponent(`${skill} ${level}`)}`
        : getYouTubeSearchUrl(completedTask.text);
      const resourceLabel = completedTask.resourceKind === "books" ? "Open a matching book" : "Search YouTube for this task";

      return (
        <div className="app">
          <div className="card">
            <p className="progress-label">Task complete</p>
            <h1>Nice work</h1>
            <p>You completed: {completedTask.text}</p>
            <div className="overall-progress">
              <div className="overall-progress-heading"><span>Roadmap progress</span><strong>{completedIds.size} of {tasks.length}</strong></div>
              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} /></div>
            </div>
            <a className="button button-secondary resource-action" href={resourceUrl} target="_blank" rel="noopener noreferrer">{resourceLabel}</a>
            <button
              className="button"
              onClick={() => {
                setCompletedTaskId(null);
                setStep(6);
              }}
            >
              {nextTask ? "Next task" : "See today's progress"}
            </button>
          </div>
        </div>
      );
    }

    if (step === 6 && nextTask) {
      const dayTaskIndex = todayTasks.findIndex((task) => task.id === nextTask.id);
      const selectedBook = nextTask.resourceKind === "books" ? books[0] : undefined;
      const resourceUrl = selectedBook
        ? `https://openlibrary.org${selectedBook.key}`
        : nextTask.resourceKind === "books"
          ? `https://openlibrary.org/search?q=${encodeURIComponent(`${skill} ${level}`)}`
          : getYouTubeSearchUrl(nextTask.text);

      return (
        <div className="app">
          <div className="card">
            <p className="progress-label">Task {dayTaskIndex + 1} of {todayTasks.length} today</p>
            <h1>{nextTask.text}</h1>
            <a className="button button-secondary resource-action" href={resourceUrl} target="_blank" rel="noopener noreferrer">
              {selectedBook ? `Read ${selectedBook.title}` : nextTask.resourceLabel}
            </a>
            <button
              className="button"
              onClick={() => {
                setProgress((current) => current && completeTask(current, nextTask.id));
                setCompletedTaskId(nextTask.id);
              }}
            >
              Mark task complete
            </button>
            <button className="text-button" onClick={() => setStep(5)}>Back to today's plan</button>
          </div>
        </div>
      );
    }

    const previousDayTasks = progress.previousDay?.completedTaskIds.flatMap((taskId) => {
      const task = tasksById.get(taskId);
      return task ? [task] : [];
    }) ?? [];

    return (
      <div className="app">
        <div className="card plan-card">
          <p className="progress-label">Your learning plan</p>
          <h1>Your path to {skill}</h1>
          <div className="plan-meta">
            <span className="plan-badge">{level}</span>
            <span className="plan-badge">{phase}</span>
            <span className="plan-badge">{timePerDay} min/day</span>
          </div>

          <div className="overall-progress">
            <div className="overall-progress-heading"><span>Overall progress</span><strong>{completedIds.size} of {tasks.length} tasks</strong></div>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} /></div>
          </div>

          {previousDayTasks.length > 0 && (
            <div className="return-summary">
              <strong>Last time, you made progress.</strong>
              <span>You completed {previousDayTasks.length} {previousDayTasks.length === 1 ? "task" : "tasks"} in {skill}.</span>
              <ul>{previousDayTasks.map((task) => <li key={task.id}>{task.text}</li>)}</ul>
            </div>
          )}

          <h2 className="section-title">Today's tasks</h2>
          {todayTasks.length > 0 ? (
            <ul className="task-list">
              {todayTasks.map((task) => (
                <li className={completedIds.has(task.id) ? "task-done" : ""} key={task.id}>
                  <span>{task.text}</span>
                  {completedIds.has(task.id) && <strong className="task-check">Done</strong>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="resource-message">You completed this roadmap. Choose another skill to keep learning.</div>
          )}
          {isDayComplete && renderDayRecap()}
          {!isDayComplete && todayTasks.length > 0 && (
            <button className="button" onClick={() => { setCompletedTaskId(null); setStep(6); }}>
              {completedIds.size > 0 ? "Continue today's tasks" : "Start today's tasks"}
            </button>
          )}

          <section className="recommendation-section">
            <h2 className="section-title">Videos for {skill}</h2>
            <a className="button button-secondary resource-action" href={getYouTubeSearchUrl(skill)} target="_blank" rel="noopener noreferrer">
              Search YouTube for {skill}
            </a>
          </section>

          <section className="recommendation-section">
            <h2 className="section-title">Books for {skill}</h2>
            {bookStatus === "loading" && <p className="resource-message">Finding books about {skill}...</p>}
            {bookStatus === "ready" && (
              <div className="books">
                {books.map((book) => (
                  <a className="book-card" href={`https://openlibrary.org${book.key}`} target="_blank" rel="noopener noreferrer" key={book.key}>
                    {book.cover_i ? <img src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} alt="" className="book-cover" /> : <div className="book-cover book-cover-placeholder">Book</div>}
                    <span className="book-info"><strong className="book-title">{book.title}</strong>{book.author_name?.[0] && <span className="book-author">{book.author_name[0]}</span>}</span>
                  </a>
                ))}
              </div>
            )}
            {(bookStatus === "empty" || bookStatus === "error") && (
              <div className="resource-message">
                <p>{bookStatus === "error" ? "Book recommendations are unavailable right now." : `No books with clear ${skill} matches were found.`}</p>
                <a href={`https://openlibrary.org/search?q=${encodeURIComponent(`${skill} ${level}`)}`} target="_blank" rel="noopener noreferrer">Search Open Library for {skill}</a>
              </div>
            )}
          </section>

          <button className="text-button reset-button" onClick={resetPlan}>Choose a different skill</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;