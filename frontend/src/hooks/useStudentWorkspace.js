import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { createStudent, getStudents } from "../services/api";

function normalizeStudent(student) {
  if (!student) {
    return null;
  }

  return {
    id: student.id || student._id,
    name: student.name,
    class: student.class,
    school: student.school,
    ...student,
  };
}

export function useStudentWorkspace() {
  const { currentStudent, setCurrentStudent } = useAppContext();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const normalizedCurrentStudent = useMemo(
    () => normalizeStudent(currentStudent),
    [currentStudent],
  );

  useEffect(() => {
    refreshStudents();
  }, []);

  useEffect(() => {
    if (!students.length) {
      if (normalizedCurrentStudent) {
        setCurrentStudent(null);
      }
      return;
    }

    const currentStudentId = normalizedCurrentStudent?.id;
    const matchingStudent = students.find((student) => student.id === currentStudentId);

    if (!currentStudentId) {
      return;
    }

    if (!matchingStudent) {
      setCurrentStudent(null);
    }
  }, [normalizedCurrentStudent?.id, setCurrentStudent, students]);

  async function refreshStudents() {
    try {
      setLoading(true);
      const studentList = await getStudents();
      const normalizedStudents = studentList.map(normalizeStudent);
      setStudents(normalizedStudents);
      setError(null);
    } catch (fetchError) {
      console.error("Error loading students:", fetchError);
      setStudents([]);
      setError(fetchError.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  function selectStudent(studentId) {
    if (!studentId) {
      setCurrentStudent(null);
      return;
    }

    const selectedStudent = students.find((student) => student.id === studentId);

    if (selectedStudent) {
      setCurrentStudent(selectedStudent);
    }
  }

  async function createStudentProfile(studentData) {
    try {
      setCreating(true);
      const response = await createStudent(studentData);
      const newStudent = normalizeStudent(response.data || response);
      setStudents((previousStudents) => [newStudent, ...previousStudents]);
      setCurrentStudent(newStudent);
      setError(null);
      return newStudent;
    } catch (createError) {
      console.error("Error creating student:", createError);
      setError(createError.message || "Failed to create student");
      throw createError;
    } finally {
      setCreating(false);
    }
  }

  return {
    students,
    loading,
    error,
    creating,
    currentStudent: normalizedCurrentStudent,
    selectStudent,
    createStudentProfile,
    refreshStudents,
  };
}

export default useStudentWorkspace;
