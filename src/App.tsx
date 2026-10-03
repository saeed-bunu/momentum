import { useEffect, useState } from "react";
import QuestionStep from "./QuestionStep";

type Book = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
};

type Task = {
  text: string;
  resourceLabel?: string;
  resourceUrl?: string;
};

const TASKS_BY_LEVEL: Record<string, (skill: string) => Task[]> = {
  Beginner: (skill) => [
    {
      text: `Read an introduction to ${skill}`,
      resourceLabel: "Find beginner books",
      resourceUrl: `https://openlibrary.org/search?q=${encodeURIComponent(`${skill} for beginners`)}`,
    },
    {
      text: `Watch a beginner ${skill} tutorial`,
      resourceLabel: "Watch on YouTube",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} beginner practice`)}`,
    },
    {
      text: `Practice the core basics of ${skill}`,
      resourceLabel: "Find practice videos",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} beginner practice`)}`,
    },
  ],

  Intermediate: (skill) => [
    {
      text: `Build a small ${skill} project from scratch`,
      resourceLabel: "Find project ideas",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} beginner project ideas`)}`,
    },
    {
      text: `Watch an intermediate ${skill} deep-dive`,
      resourceLabel: "Watch on YouTube",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} intermediate deep dive`)}`,
    },
    {
      text: `Solve 3 ${skill} practice exercises`,
      resourceLabel: "Find exercises",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} intermediate exercises`)}`,
    },
  ],

  Advanced: (skill) => [
    {
      text: `Read advanced ${skill} articles or papers`,
      resourceLabel: "Find advanced books",
      resourceUrl: `https://openlibrary.org/search?q=${encodeURIComponent(`${skill} advanced`)}`,
    },
    {
      text: `Build a complex ${skill} feature end-to-end`,
      resourceLabel: "Watch architecture videos",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} advanced architecture`)}`,
    },
    {
      text: `Teach or write about ${skill}`,
      resourceLabel: "Get ideas from others",
      resourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} tutorial explained`)}`,
    },
  ],
};

function App() {
  const [step, setStep] = useState(1);
  const [skill, setSkill] = useState("");
  const [level, setLevel] = useState("");
  const [timePerDay, setTimePerDay] = useState(15);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    if (step !== 5 || !skill || !level) {
      return;
    }

    let isMounted = true;

    async function fetchBooks() {
      setBooksLoading(true);

      try {
        const query = `${skill} for ${level.toLowerCase()}`;
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=title,author_name,cover_i,key`
        );
        const data = await response.json();

        if (isMounted) {
          setBooks(data.docs || []);
        }
      } catch {
        if (isMounted) {
          setBooks([]);
        }
      } finally {
        if (isMounted) {
          setBooksLoading(false);
        }
      }
    }

    fetchBooks();

    return () => {
      isMounted = false;
    };
  }, [step, skill, level]);

  if (step === 1) {
    return (
      <div className="app">
        <div className="card">
          <h1>Momentum</h1>
          <p>Build skills. Stay consistent.</p>
          <button className="button" onClick={() => setStep(2)}>
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="app">
        <div className="card">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: "33%" }} />
          </div>

          <h1>What skill do you want to learn?</h1>
          <input
            className="input"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="eg. Coding, Sales, Marketing..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && skill.trim() !== "") {
                setStep(3);
              }
            }}
          />

          <button
            className="button"
            onClick={() => setStep(3)}
            disabled={skill.trim() === ""}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <QuestionStep
        progress={66}
        stepLabel="Step 2 of 3"
        question={`What's your current level in ${skill}?`}
        options={[
          { label: "Beginner", value: "Beginner" },
          { label: "Intermediate", value: "Intermediate" },
          { label: "Advanced", value: "Advanced" },
        ]}
        onSelect={(value) => {
          setLevel(String(value));
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
          setTimePerDay(Number(value));
          setStep(5);
        }}
      />
    );
  }

  if (step === 5) {
    const phase =
      level === "Beginner"
        ? "Foundations"
        : level === "Intermediate"
          ? "Building Skills"
          : "Mastery";

    const allTasks = (TASKS_BY_LEVEL[level] || TASKS_BY_LEVEL.Beginner)(skill);
    const tasksCount = timePerDay === 15 ? 1 : timePerDay === 30 ? 2 : 3;
    const tasks = allTasks.slice(0, tasksCount);

    return (
      <div className="app">
        <div className="card">
          <h1>Your Path to {skill}</h1>
          <div className="plan-meta">
            <span className="plan-badge">{level}</span>
            <span className="plan-badge">{phase}</span>
            <span className="plan-badge">{timePerDay} min/day</span>
          </div>

          <h2 className="section-title">Recommended Videos</h2>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} ${level} tutorial`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary"
            style={{ display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Watch {level} {skill} tutorials
          </a>

          <h2 className="section-title">Recommended Books</h2>
          {booksLoading && <p>Finding books...</p>}
          {!booksLoading && books.length === 0 && (
            <p>No books found — try a different skill.</p>
          )}

          <div className="books">
            {books.map((book) => (
              <a
                key={book.key}
                href={`https://openlibrary.org${book.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="book-card"
              >
                {book.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                    alt={book.title}
                    className="book-cover"
                  />
                ) : (
                  <div className="book-cover book-cover-placeholder">Book</div>
                )}

                <div className="book-info">
                  <div className="book-title">{book.title}</div>
                  {book.author_name && <div className="book-author">{book.author_name[0]}</div>}
                </div>
              </a>
            ))}
          </div>

          <h2 className="section-title">Today's Tasks</h2>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.text}>{task.text}</li>
            ))}
          </ul>

          <button className="button" onClick={() => setStep(6)}>
            Start Today's Task
          </button>
        </div>
      </div>
    );
  }

  if (step === 6) {
    const allTasks = (TASKS_BY_LEVEL[level] || TASKS_BY_LEVEL.Beginner)(skill);
    const tasksCount = timePerDay === 15 ? 1 : timePerDay === 30 ? 2 : 3;
    const tasks = allTasks.slice(0, tasksCount);
    const currentTask = tasks[currentTaskIndex] ?? tasks[0];
    const isLastTask = currentTaskIndex >= tasks.length - 1;

    if (completed) {
      return (
        <div className="app">
          <div className="card">
            <div className="celebration">🎉</div>
            <h1>Nice work</h1>
            <p style={{ color: "#f59e0b", fontWeight: 600 }}>Keep going</p>
            <p>You completed: {currentTask.text}</p>

            {isLastTask ? (
              <>
                <p>That&apos;s everything for today. See you tomorrow!</p>
                <button
                  className="button"
                  onClick={() => {
                    setStep(1);
                    setCurrentTaskIndex(0);
                    setCompleted(false);
                  }}
                >
                  Start Over
                </button>
              </>
            ) : (
              <button
                className="button"
                onClick={() => {
                  setCurrentTaskIndex((prev) => prev + 1);
                  setCompleted(false);
                }}
              >
                Next Task
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="app">
        <div className="card">
          <div className="progress">
            <p>
              Task {currentTaskIndex + 1} of {tasks.length}
            </p>
          </div>

          <h1>{currentTask.text}</h1>

          {currentTask.resourceUrl && (
            <a
              href={currentTask.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-secondary"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                marginBottom: "12px",
              }}
            >
              {currentTask.resourceLabel || "Open resource"}
            </a>
          )}

          <button className="button" onClick={() => setCompleted(true)}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;