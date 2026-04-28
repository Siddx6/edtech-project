import { useEffect, useState } from "react";
import { getStudentOverview } from "../services/api";

export function useStudentOverview(studentId) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setOverview(null);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        const overviewData = await getStudentOverview(studentId);

        if (!ignore) {
          setOverview(overviewData);
          setError(null);
        }
      } catch (fetchError) {
        if (!ignore) {
          console.error("Error loading student overview:", fetchError);
          setOverview(null);
          setError(fetchError.message || "Failed to load student overview");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      ignore = true;
    };
  }, [studentId]);

  return {
    overview,
    loading,
    error,
  };
}

export default useStudentOverview;
