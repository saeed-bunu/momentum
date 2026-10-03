type QuestionStepProps = {
    question: string;
    options: {
        label: string; value: string | number }[];
    onSelect: (value: string | number) => void;
    progress: number;
    stepLabel: string;        
};

function QuestionStep( {question, options, onSelect, progress, stepLabel}: QuestionStepProps) {
    return (
        <div className="app">
            <div className="card">
                <div className="progress-label">{stepLabel}</div>
                <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%`}} />
           </div>
            <h1>{question}</h1>
            {options.map((option) => (
                <button className="button"
                key={option.label}
                onClick={() => onSelect(option.value)}>
                    {option.label}
                </button>
            ))}
        </div>
        </div>
    );
}

export default QuestionStep;