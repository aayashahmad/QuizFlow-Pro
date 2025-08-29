import { useEffect, useState } from "react";
import "./App.css";

const decode = (s) => {
  const t = document.createElement("textarea");
  t.innerHTML = s ?? "";
  return t.value;
};

function FlipCard({ q, onReveal }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (selected !== null) {
      setRevealed(true);
      onReveal(q.id, selected, q.correct); 
    }
  };

  const isCorrect = revealed && selected === q.correct;

  return (
    <div className="card-container">
      <div className={`quiz-card ${revealed ? 'revealed' : ''}`}>
        <div className="card-header">
          <div className="question-number">Q</div>
          <div className="card-status">
            {revealed && (
              <div className={`status-indicator ${isCorrect ? 'correct' : 'wrong'}`}>
                {isCorrect ? '✓' : '✗'}
              </div>
            )}
          </div>
        </div>
        
        <div className="card-content">
          <p className="question">{q.question}</p>

          <form onSubmit={onSubmit} className="quiz-form">
            <div className="options-grid">
              {q.answers.map((a, i) => {
                const checked = selected === a;
                const showCorrect = revealed && a === q.correct;
                const showWrong = revealed && checked && a !== q.correct;
                
                return (
                  <div
                    key={`${q.id}-${i}`}
                    className={`option-card ${checked ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                    onClick={() => !revealed && setSelected(a)}
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={a}
                      checked={checked}
                      onChange={() => setSelected(a)}
                      disabled={revealed}
                      className="option-input"
                    />
                    <span className="option-text">{a}</span>
                    <div className="option-indicator">
                      {showCorrect && <span className="check-icon">✓</span>}
                      {showWrong && <span className="x-icon">✗</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!revealed && (
              <button 
                type="submit" 
                className={`submit-btn ${selected === null ? 'disabled' : 'enabled'}`}
                disabled={selected === null}
              >
                <span>Check Answer</span>
                <div className="btn-shine"></div>
              </button>
            )}
          </form>

          {revealed && (
            <div className="result-section">
              <div className={`result-banner ${isCorrect ? 'success' : 'error'}`}>
                <div className="result-icon">
                  {isCorrect ? '🎉' : '😅'}
                </div>
                <div className="result-text">
                  <h4>{isCorrect ? "Excellent!" : "Oops!"}</h4>
                  <p>{isCorrect ? "You got it right!" : "Better luck next time!"}</p>
                </div>
              </div>
              
              {!isCorrect && (
                <div className="correct-answer-display">
                  <span className="correct-label">Correct answer:</span>
                  <span className="correct-value">{q.correct}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState(9);
  const [amount, setAmount] = useState(10);
  const [qs, setQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [progress, setProgress] = useState({});
  const [version, setVersion] = useState(0); 

  const revealedCount = Object.values(progress).filter(p => p.revealed).length;
  const totalCorrect = Object.values(progress).filter(p => p.isCorrect).length;
  const totalWrong = Math.max(0, revealedCount - totalCorrect);
  const percent = revealedCount ? Math.round((totalCorrect / revealedCount) * 100) : 0;

  useEffect(() => {
    fetch("https://opentdb.com/api_category.php")
      .then((r) => r.json())
      .then((j) => setCats(j.trivia_categories || []))
      .catch(() => setCats([]));
  }, []);

  useEffect(() => {
    if (cats.length && qs.length === 0) generate();
  }, [cats]);

  const generate = async () => {
    setLoading(true);
    setErrMsg("");
    setProgress({});
    setVersion(v => v + 1); 

    const safeAmount = Number.isInteger(amount) && amount >= 1 && amount <= 50 ? amount : 10;

    try {
      const r = await fetch(
        `https://opentdb.com/api.php?amount=${safeAmount}&category=${catId}`
      );
      const j = await r.json();

      if (!j || j.response_code !== 0 || !Array.isArray(j.results)) {
        setQs([]);
        setErrMsg("No questions returned. Try another category or amount.");
        return;
      }

      const data = j.results.map((it, i) => {
        const answers = [...it.incorrect_answers, it.correct_answer].map(decode);

        for (let k = answers.length - 1; k > 0; k--) {
          const rand = Math.floor(Math.random() * (k + 1));
          [answers[k], answers[rand]] = [answers[rand], answers[k]];
        }

        return {
          id: `${Date.now()}-${i}`,
          question: decode(it.question),
          correct: decode(it.correct_answer),
          answers,
        };
      });

      setQs(data);
    } catch {
      setErrMsg("Failed to fetch questions. Please try again.");
      setQs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = (id, selected, correct) => {
    setProgress(prev => ({
      ...prev,
      [id]: { selected, isCorrect: selected === correct, revealed: true },
    }));
  };

  const handleReset = () => {
    setAmount(10);
    setProgress({});
    setErrMsg("");
    setQs([]);          
    setVersion(v => v + 1); 
    generate();
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">QuizFlow Pro</h1>
        <p className="app-subtitle">Test your knowledge with beautiful interactive quizzes</p>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-grid">
        <div className="stat-card questions">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{qs.length}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-card correct">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{totalCorrect}</div>
          <div className="stat-label">Correct</div>
        </div>
        <div className="stat-card wrong">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{totalWrong}</div>
          <div className="stat-label">Wrong</div>
        </div>
        <div className="stat-card accuracy">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{percent}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-panel">
        <div className="controls-grid">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              value={catId} 
              onChange={(e) => setCatId(Number(e.target.value))}
              className="form-select"
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={amount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setAmount(Number.isFinite(n) ? n : 10);
              }}
              className="form-input"
            />
          </div>

          <div className="button-group">
            <button 
              onClick={generate} 
              disabled={loading}
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
            >
              {loading ? '🔄 Loading...' : '🎯 Generate'}
            </button>

            <button 
              onClick={handleReset}
              className="btn btn-secondary"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {errMsg && (
        <div className="error-message">
          ⚠️ {errMsg}
        </div>
      )}

      {/* Questions Grid */}
      <div className="questions-grid">
        {qs.map((q) => (
          <FlipCard key={`${q.id}-${version}`} q={q} onReveal={handleReveal} />
        ))}
      </div>
    </div>
  );
}