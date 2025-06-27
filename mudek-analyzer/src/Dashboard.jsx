// src/Dashboard.jsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';

import {
  Box, Typography, Paper, Select, MenuItem, Button, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';

const STUDENT_ANALYSIS_FN = 'calculate_student_po_scores';
const MAX_SCORE_FN = 'calculate_max_po_scores';

export default function Dashboard({ session }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function getInitialData() {
      const { data: studentData } = await supabase.from('students').select('id, student_id');
      setStudents(studentData || []);

      const { data: offeringData } = await supabase.from('course_offerings').select('id, semester, course_id(course_code)');
      setCourseOfferings(offeringData || []);
    }
    getInitialData();
  }, []);

  const runAnalysis = async () => {
    if (!selectedStudentId || !selectedOfferingId) {
      toast.error('Please select a student AND a course offering.');
      return;
    }
    setLoading(true);
    setResults([]);
    const toastId = toast.loading('Running analysis...');

    try {
      const [studentResults, maxScoreResults] = await Promise.all([
        supabase.rpc(STUDENT_ANALYSIS_FN, { p_student_id: selectedStudentId }),
        supabase.rpc(MAX_SCORE_FN, { p_course_offering_id: selectedOfferingId })
      ]);

      if (studentResults.error) throw studentResults.error;
      if (maxScoreResults.error) throw maxScoreResults.error;

      const maxScoresMap = new Map(maxScoreResults.data.map(item => [item.po_code, item.max_score]));

      const processedResults = studentResults.data.map(po => {
        const THRESHOLD = 3.0;
        const maxScoreForPO = maxScoresMap.get(po.po_code) || 1;
        const scaled_score = (po.raw_score / maxScoreForPO) * 5;
        const capped_score = Math.min(scaled_score, 5);
        const success = capped_score >= THRESHOLD;
        return { ...po, scaled_score: capped_score.toFixed(2), success, max_score: maxScoreForPO };
      });
      setResults(processedResults);
      toast.success('Analysis complete!', { id: toastId });
    } catch (error) {
      toast.error(`Analysis failed: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" gutterBottom>Student Assessment</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl fullWidth>
          <InputLabel id="student-select-label">Student</InputLabel>
          <Select labelId="student-select-label" value={selectedStudentId} label="Student" onChange={(e) => setSelectedStudentId(e.target.value)}>
            {students.map(student => (
              <MenuItem key={student.id} value={student.id}>{student.student_id}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="course-select-label">Course Offering</InputLabel>
          <Select labelId="course-select-label" value={selectedOfferingId} label="Course Offering" onChange={(e) => setSelectedOfferingId(e.target.value)}>
            {courseOfferings.map(offering => (
              <MenuItem key={offering.id} value={offering.id}>
                {`${offering.course_id.course_code} (${offering.semester})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={runAnalysis}
          disabled={loading || !selectedStudentId || !selectedOfferingId}
          sx={{ height: '56px', width: '200px' }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Box>

      {results.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Code</TableCell>
                <TableCell align="right">Raw Score</TableCell>
                <TableCell align="right">Max Score</TableCell>
                <TableCell align="right">Scaled Score (5)</TableCell>
                <TableCell>Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((res) => (
                <TableRow key={res.po_code}>
                  <TableCell>{res.po_code}</TableCell>
                  <TableCell align="right">{res.raw_score}</TableCell>
                  <TableCell align="right">{res.max_score}</TableCell>
                  <TableCell align="right">{res.scaled_score}</TableCell>
                  <TableCell>
                    <Chip
                      label={res.success ? 'Achieved' : 'Not Achieved'}
                      color={res.success ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}