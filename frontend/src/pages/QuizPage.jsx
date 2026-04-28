import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import StudentSelector from "../components/StudentSelector";
import useStudentWorkspace from "../hooks/useStudentWorkspace";
import useStudentOverview from "../hooks/useStudentOverview";
import { generatePracticeQuiz } from "../services/api";
import "./PortalPages.css";

function QuizPage({ userRole }) {
  const location = useLocation();
  const preferredSubject = location.state?.preferredSubject || "";
  const {
    students,
    loading: studentLoading,
    error: studentError,
    creating,
    currentStudent,
    selectStudent,
    createStudentProfile,
  } = useStudentWorkspace();
  const {
    overview,
    loading: overviewLoading,
    error: overviewError,
  } = useStudentOverview(currentStudent?.id);
  const [subject, setSubject] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("adaptive");
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [quizSelections, setQuizSelections] = useState({});

  const availableSubjects = useMemo(
    () => overview?.summary?.subjects || [],
    [overview],
  );

  const quizQuestions = useMemo(() => quiz?.questions || [], [quiz]);

  const answeredCount = useMemo(
    () => Object.keys(quizSelections).length,
    [quizSelections],
  );

  const correctCount = useMemo(
    () =>
      quizQuestions.reduce((count, question) => {
        if (quizSelections[question.question_no] === question.correct_option) {
          return count + 1;
        }

        return count;
      }, 0),
    [quizQuestions, quizSelections],
  );

  useEffect(() => {
    setQuiz(null);
    setQuizError(null);
    setQuizSelections({});
  }, [currentStudent?.id]);

  useEffect(() => {
    if (!availableSubjects.length) {
      setSubject("");
      return;
    }

    if (preferredSubject && availableSubjects.includes(preferredSubject)) {
      setSubject(preferredSubject);
      return;
    }

    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [availableSubjects, preferredSubject, subject]);

  const handleGenerateQuiz = async (event) => {
    event.preventDefault();

    if (!currentStudent?.id || !subject) {
      setQuizError("Select a student and subject before generating a quiz.");
      return;
    }

    try {
      setLoadingQuiz(true);
      const response = await generatePracticeQuiz({
        student_id: currentStudent.id,
        subject,
        question_count: Number(questionCount),
        difficulty,
      });
      setQuiz(response.data || response);
      setQuizSelections({});
      setQuizError(null);
    } catch (error) {
      console.error("Error generating practice quiz:", error);
      setQuiz(null);
      setQuizSelections({});
      setQuizError(error.message || "Failed to generate practice quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (questionNumber, optionLabel) => {
    setQuizSelections((previousSelections) => {
      if (previousSelections[questionNumber]) {
        return previousSelections;
      }

      return {
        ...previousSelections,
        [questionNumber]: optionLabel,
      };
    });
  };

  if (userRole !== "student") {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          Switch to student mode to generate practice quizzes from weak topics.
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Revision Quiz</h1>
          <p className="portal-subtitle">
            Generate a remedial quiz from the student&apos;s weak chapters and recent exam history.
          </p>
        </div>
      </div>

      <StudentSelector
        students={students}
        loading={studentLoading}
        creating={creating}
        error={studentError}
        currentStudent={currentStudent}
        onSelectStudent={selectStudent}
        onCreateStudent={createStudentProfile}
      />

      {studentLoading && !currentStudent ? (
        <div className="portal-loading">Loading student profiles...</div>
      ) : overviewLoading ? (
        <div className="portal-loading">Loading student quiz context...</div>
      ) : overviewError ? (
        <div className="portal-error">{overviewError}</div>
      ) : !currentStudent ? (
        <div className="portal-empty">
          Your student profile appears automatically after the first analyzed answer sheet. Manual creation is only a fallback if extraction is unavailable.
        </div>
      ) : (
        <>
          <Card className="portal-card">
            <form className="portal-stack" onSubmit={handleGenerateQuiz}>
              <div className="portal-form-grid">
                <div>
                  <label className="portal-label" htmlFor="quiz-subject">
                    Subject
                  </label>
                  <select
                    id="quiz-subject"
                    className="portal-select"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    disabled={availableSubjects.length === 0}
                  >
                    {availableSubjects.length === 0 ? (
                      <option value="">No analyzed subjects available yet</option>
                    ) : (
                      availableSubjects.map((subjectOption) => (
                        <option key={subjectOption} value={subjectOption}>
                          {subjectOption}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="portal-label" htmlFor="quiz-count">
                    Questions
                  </label>
                  <select
                    id="quiz-count"
                    className="portal-select"
                    value={questionCount}
                    onChange={(event) => setQuestionCount(event.target.value)}
                  >
                    {["5", "10", "15", "20"].map((count) => (
                      <option key={count} value={count}>
                        {count} questions
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="portal-label" htmlFor="quiz-difficulty">
                    Difficulty
                  </label>
                  <select
                    id="quiz-difficulty"
                    className="portal-select"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                  >
                    {["adaptive", "easy", "medium", "hard"].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(quizError || studentError) && (
                <p className="portal-error-text">{quizError || studentError}</p>
              )}

              <div className="portal-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loadingQuiz || availableSubjects.length === 0}
                >
                  {loadingQuiz ? "Generating Quiz..." : "Generate Quiz"}
                </Button>
              </div>
            </form>
          </Card>

          {quiz && (
            <div className="portal-section">
              <Card className="portal-card">
                <div className="portal-stack">
                  <div>
                    <h2 className="portal-section-title">
                      {quiz.quiz_info?.title || "Practice Quiz"}
                    </h2>
                    <p className="portal-subtitle">
                      {quiz.quiz_info?.subject} | {quiz.quiz_info?.class} |{" "}
                      {quiz.quiz_info?.difficulty}
                    </p>
                  </div>

                  <div className="portal-quiz-progress">
                    <Badge variant="primary">
                      Answered {answeredCount}/{quizQuestions.length}
                    </Badge>
                    <Badge variant="success">
                      Correct {correctCount}
                    </Badge>
                    {answeredCount === quizQuestions.length &&
                      quizQuestions.length > 0 && (
                        <Badge variant="info">Quiz Completed</Badge>
                      )}
                  </div>

                  <div className="portal-chip-row">
                    {(quiz.quiz_info?.based_on_weak_chapters || [])
                      .flatMap((chapter) => chapter.sub_topics || [chapter.chapter_name])
                      .slice(0, 6)
                      .map((topic) => (
                        <span key={topic} className="portal-chip portal-chip-warning">
                          {topic}
                        </span>
                      ))}
                  </div>

                  <div className="portal-stack">
                    {quizQuestions.map((question) => {
                      const selectedOption =
                        quizSelections[question.question_no] || null;
                      const isAnswered = Boolean(selectedOption);
                      const isCorrect =
                        selectedOption === question.correct_option;
                      const correctOptionText =
                        question.options?.[optionLabelToIndex(question.correct_option)] ||
                        "";

                      return (
                      <div
                        key={question.question_no}
                        className={`portal-quiz-question ${
                          isAnswered
                            ? isCorrect
                              ? "portal-quiz-question-correct"
                              : "portal-quiz-question-incorrect"
                            : ""
                        }`}
                      >
                        <div className="portal-quiz-question-header">
                          <div className="portal-actions">
                            <h4>Question {question.question_no}</h4>
                            {question.focus_chapter && (
                              <Badge variant="info">{question.focus_chapter}</Badge>
                            )}
                          </div>
                          <Badge variant={isAnswered ? (isCorrect ? "success" : "danger") : "default"}>
                            {isAnswered ? (isCorrect ? "Correct" : "Incorrect") : "Select an answer"}
                          </Badge>
                        </div>
                        <p>{question.question_text}</p>
                        <div className="portal-quiz-options">
                          {(question.options || []).map((option, index) => {
                            const optionLabel = ["A", "B", "C", "D"][index];
                            const optionState = getQuizOptionState({
                              optionLabel,
                              selectedOption,
                              correctOption: question.correct_option,
                            });

                            return (
                              <button
                                key={`${question.question_no}-${optionLabel}`}
                                type="button"
                                className={`portal-quiz-option portal-quiz-option-${optionState}`}
                                onClick={() =>
                                  handleSelectOption(question.question_no, optionLabel)
                                }
                                disabled={isAnswered}
                                aria-pressed={selectedOption === optionLabel}
                              >
                                <span className="portal-quiz-option-label">
                                  {optionLabel}.
                                </span>
                                <span className="portal-quiz-option-text">{option}</span>
                              </button>
                            );
                          })}
                        </div>
                        {isAnswered && (
                          <div
                            className={`portal-quiz-feedback ${
                              isCorrect
                                ? "portal-quiz-feedback-correct"
                                : "portal-quiz-feedback-incorrect"
                            }`}
                          >
                            <p className="portal-quiz-feedback-title">
                              {isCorrect
                                ? "Correct choice. Well done."
                                : `Not quite. The correct answer is ${question.correct_option}. ${correctOptionText}`}
                            </p>
                            {question.explanation && (
                              <p className="portal-quiz-feedback-text">
                                Explanation: {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getQuizOptionState({ optionLabel, selectedOption, correctOption }) {
  if (!selectedOption) {
    return "idle";
  }

  if (optionLabel === correctOption) {
    return "correct";
  }

  if (optionLabel === selectedOption) {
    return "incorrect";
  }

  return "idle";
}

function optionLabelToIndex(optionLabel) {
  return ["A", "B", "C", "D"].indexOf(optionLabel);
}

export default QuizPage;
