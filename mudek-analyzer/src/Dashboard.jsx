// src/Dashboard.jsx
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Our two database function names
const STUDENT_ANALYSIS_FN = 'calculate_student_po_scores';
const MAX_SCORE_FN = 'calculate_max_po_scores';

export default function Dashboard({ session }) {
  // State for students
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // NEW: State for course offerings
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Effect to fetch initial data: students and all course offerings
  useEffect(() => {
    async function getInitialData() {
      // Fetch students
      const { data: studentData, error: studentError } = await supabase.from('students').select('id, student_id');
      if (studentError) console.error('Error fetching students:', studentError);
      else setStudents(studentData || []);

      // Fetch course offerings
      // For a real app, you might only fetch courses the selected student is enrolled in.
      const { data: offeringData, error: offeringError } = await supabase.from('course_offerings').select('id, semester, course_id(course_code)');
      if (offeringError) console.error('Error fetching offerings:', offeringError);
      else setCourseOfferings(offeringData || []);
    }
    getInitialData();
  }, []);

  const runAnalysis = async () => {
    if (!selectedStudentId || !selectedOfferingId) {
      alert('Please select a student AND a course offering.');
      return;
    }

    setLoading(true);
    setResults([]);
    setError('');

    try {
      // Use Promise.all to run both database calls at the same time for efficiency
      const [studentResults, maxScoreResults] = await Promise.all([
        supabase.rpc(STUDENT_ANALYSIS_FN, { p_student_id: selectedStudentId }),
        supabase.rpc(MAX_SCORE_FN, { p_course_offering_id: selectedOfferingId })
      ]);

      // Check for errors from either call
      if (studentResults.error) throw studentResults.error;
      if (maxScoreResults.error) throw maxScoreResults.error;

      // Create a lookup map for max scores for easy access: { PO1: 500, PO2: 450, ... }
      const maxScoresMap = new Map(maxScoreResults.data.map(item => [item.po_code, item.max_score]));

      // Now, process the student's scores using the dynamic max scores
      const processedResults = studentResults.data.map(po => {
        const THRESHOLD = 3.0;
        const maxScoreForPO = maxScoresMap.get(po.po_code) || 1; // Default to 1 to avoid division by zero

        // Dynamic Scaling! No more hardcoded values.
        const scaled_score = (po.raw_score / maxScoreForPO) * 5;
        const capped_score = Math.min(scaled_score, 5); // Prevent scores > 5
        const success = capped_score >= THRESHOLD;

        return { ...po, scaled_score: capped_score.toFixed(2), success, max_score: maxScoreForPO };
      });

      setResults(processedResults);

    } catch (error) {
      console.error('An error occurred during analysis:', error);
      setError('An error occurred during analysis. Check the console for details.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>MUDEK Analysis Dashboard</h2>
        <button onClick={handleSignOut} style={{width: 'auto'}}>Sign Out</button>
      </div>
      <p>Welcome, {session.user.email}!</p>
      <hr/>

      <h3>Run Analysis</h3>
      {/* Student Selector */}
      <label htmlFor="student-select">1. Select a student:</label>
      <select id="student-select" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
        <option value="" disabled>-- Please choose a student --</option>
        {students.map(student => (
          <option key={student.id} value={student.id}>{student.student_id}</option>
        ))}
      </select>

      {/* Course Offering Selector */}
      <label htmlFor="offering-select">2. Select a course offering:</label>
      <select id="offering-select" value={selectedOfferingId} onChange={(e) => setSelectedOfferingId(e.target.value)}>
        <option value="" disabled>-- Please choose a course --</option>
        {courseOfferings.map(offering => (
          <option key={offering.id} value={offering.id}>
            {`${offering.course_id.course_code} (${offering.semester})`}
          </option>
        ))}
      </select>

      <button onClick={runAnalysis} disabled={loading || !selectedStudentId || !selectedOfferingId}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && <p style={{color: 'red'}}>{error}</p>}

      {results.length > 0 && (
        <div>
          <h3>Analysis Results</h3>
          <table>
            <thead>
              <tr>
                <th>PO Code</th>
                <th>Student's Raw Score</th>
                <th>Max Possible Score</th>
                <th>Scaled Score (out of 5)</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {results.map(res => (
                <tr key={res.po_code}>
                  <td>{res.po_code}</td>
                  <td>{res.raw_score}</td>
                  <td>{res.max_score}</td>
                  <td>{res.scaled_score}</td>
                  <td style={{ fontWeight: 'bold', color: res.success ? 'green' : 'red' }}>
                    {res.success ? 'Achieved' : 'Not Achieved'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}