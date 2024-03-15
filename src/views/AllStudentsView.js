import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllStudentsView.css';

const AllStudentsView = ({ loggedInUserName }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/allstudents');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error.message);
    }
  };

  const handleCheckboxChange = (studentId) => {
    const index = selectedStudents.indexOf(studentId);
    if (index === -1) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handlePickMentees = async () => {
    try {
      let count;
      let selectedCount = selectedStudents.length; // Count of selected students
  
      do {
        // Fetch count of mentees assigned to the mentor
        const countResponse = await axios.get('http://localhost:5000/count-my-mentees');
        count = countResponse.data.count;
  
        if (count + selectedCount > 4) { // Updated validation logic
          alert('Invalid Mentee Entries. Mentee count must be between 3 and 4.');
          return;
        }
  
        // Post request only if the count is within the range
        const response = await axios.post('http://localhost:5000/pick-mentees', {
          mentorName: loggedInUserName,
          selectedStudents: selectedStudents
        });
        console.log(response.data);
        fetchStudents();
        setSelectedStudents([]);
      } while ( count > 4);
    } catch (error) {
      console.error('Error picking mentees:', error);
    }
  };
  
  

  return (
    <div className="all-students-container">
      <h1>All Students View</h1>
      <table className="students-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Status</th>
            <th>Assigned Mentor</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student._id} className="student-row">
              <td>{student.Stu_id}</td>
              <td>{student.Name}</td>
              <td>{student.email}</td>
              <td>{student.phone_no}</td>
              <td>{student.Status}</td>
              <td>{student.Status === "Assigned" ? student["Assigned Mentor"] : ''}</td>
              <td>
                {student.Status === "Assigned" ? (
                  <span style={{ color: 'red' }}>&#10060;</span> // Red cross
                ) : (
                  student.Status === "Unassigned" && (
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => handleCheckboxChange(student._id)}
                    />
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
          <button onClick={handlePickMentees}>Pick Mentees</button>
      </div>
    </div>
  );
}

export default AllStudentsView;
