import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import { formatDate, getTeacherAnalytics } from "../services/api";
import "./PortalPages.css";

function AnalyticsPage({ userRole }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userRole !== "teacher") {
      setAnalytics(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsData = await getTeacherAnalytics();
        setAnalytics(analyticsData);
        setError(null);
      } catch (fetchError) {
        console.error("Error fetching analytics:", fetchError);
        setAnalytics(null);
        setError(fetchError.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userRole]);

  if (userRole !== "teacher") {
    return (
      <div className="portal-page">
        <div className="portal-empty">
          Switch to teacher mode to view class analytics and student trends.
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const papersBySubject = analytics?.papers_by_subject || [];
  const papersByClass = analytics?.papers_by_class || [];
  const performanceBySubject = analytics?.performance_by_subject || [];
  const recentActivity = analytics?.recent_activity || [];
  const topStudents = analytics?.top_students || [];

  return (
    <div className="portal-page">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Analytics</h1>
          <p className="portal-subtitle">
            Review paper volume, subject coverage, recent activity, and student performance from one place.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="portal-loading">Loading analytics...</div>
      ) : error ? (
        <div className="portal-error">{error}</div>
      ) : (
        <>
          <div className="portal-grid portal-grid-3">
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Generated Papers</span>
                <span className="portal-metric-value">{summary.total_papers || 0}</span>
                <span className="portal-metric-help">
                  {summary.pdf_papers || 0} PDF papers ready for download and checking
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Students</span>
                <span className="portal-metric-value">{summary.total_students || 0}</span>
                <span className="portal-metric-help">
                  {summary.analyzed_exams || 0} analyzed exams available
                </span>
              </div>
            </Card>
            <Card className="portal-card">
              <div className="portal-metric">
                <span className="portal-metric-label">Average Score</span>
                <span className="portal-metric-value">{summary.average_score || 0}%</span>
                <span className="portal-metric-help">
                  Based on submitted and analyzed student exams
                </span>
              </div>
            </Card>
          </div>

          <div className="portal-grid portal-grid-2 portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Papers by Subject</h2>
              {papersBySubject.length === 0 ? (
                <div className="portal-empty">No generated papers yet.</div>
              ) : (
                <div className="portal-list">
                  {papersBySubject.map((entry) => (
                    <div key={entry.label} className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">{entry.label}</span>
                        <span className="portal-list-subtitle">Generated exam papers</span>
                      </div>
                      <Badge variant="primary">{entry.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="portal-card">
              <h2 className="portal-section-title">Papers by Class</h2>
              {papersByClass.length === 0 ? (
                <div className="portal-empty">No class distribution available yet.</div>
              ) : (
                <div className="portal-list">
                  {papersByClass.map((entry) => (
                    <div key={entry.label} className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">{entry.label}</span>
                        <span className="portal-list-subtitle">Assigned paper count</span>
                      </div>
                      <Badge variant="info">{entry.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="portal-grid portal-grid-2 portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Performance by Subject</h2>
              {performanceBySubject.length === 0 ? (
                <div className="portal-empty">
                  Student performance will appear here after exam analysis.
                </div>
              ) : (
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Exams</th>
                      <th>Average</th>
                      <th>Latest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceBySubject.map((entry) => (
                      <tr key={entry.subject}>
                        <td>{entry.subject}</td>
                        <td>{entry.exam_count}</td>
                        <td>{entry.average_percentage}%</td>
                        <td>{entry.latest_percentage ?? "N/A"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card className="portal-card">
              <h2 className="portal-section-title">Top Students</h2>
              {topStudents.length === 0 ? (
                <div className="portal-empty">No analyzed student results yet.</div>
              ) : (
                <div className="portal-list">
                  {topStudents.map((student) => (
                    <div key={student.id} className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">
                          {student.name} | {student.class}
                        </span>
                        <span className="portal-list-subtitle">
                          {student.exam_count} analyzed exams
                        </span>
                      </div>
                      <Badge variant="success">{student.average_percentage}% avg</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="portal-section">
            <Card className="portal-card">
              <h2 className="portal-section-title">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <div className="portal-empty">No recent activity to show.</div>
              ) : (
                <div className="portal-list">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="portal-list-item">
                      <div className="portal-list-main">
                        <span className="portal-list-title">{activity.title}</span>
                        <span className="portal-list-subtitle">
                          {activity.subtitle} | {formatDate(activity.timestamp)}
                        </span>
                      </div>
                      <Badge variant={activity.type === "paper" ? "primary" : "info"}>
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsPage;
