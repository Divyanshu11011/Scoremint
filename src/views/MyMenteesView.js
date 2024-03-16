import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyMenteesView.css';
import { Pie } from 'react-chartjs-2';
import pdfMake from 'pdfmake/build/pdfmake'; // Import pdfMake
import pdfFonts from 'pdfmake/build/vfs_fonts'; // Import pdfMake fonts
import { Chart, registerables } from 'chart.js/auto';
Chart.register(...registerables);

// Register fonts with pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const MyMenteesView = () => {
  const [mentees, setMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [filterOption, setFilterOption] = useState('All'); // State to manage filter option

  const [error, setError] = useState(null);
  const [scores, setScores] = useState({
    Ideation: '',
    Execution: '',
    Viva_Pitch: '',
    Additional_Criterion: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [fetchedScores, setFetchedScores] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canToggleLock, setCanToggleLock] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [chartData, setChartData] = useState(null);
   

  // Fetch mentees data
  const fetchMentees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('https://scoremint.onrender.com/mymentees');
      if (response.data.success) {
        const menteesData = response.data.mentees.map(mentee => ({
          ...mentee,
          marksAssigned: mentee.MarksAssigned ? 'Yes' : 'No' // Initialize marksAssigned based on marksAssigned field
        }));
        const allMenteesLocked = menteesData.every(mentee => mentee.isLocked === true);
        setIsLocked(allMenteesLocked);
        setMentees(menteesData); // Set mentees state to trigger re-render
      } else {
        setError('Failed to fetch mentees');
      }
    } catch (error) {
      setError('Failed to fetch mentees');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    
    fetchMentees();
  }, []);
  
  

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
  };
  const filteredMentees = mentees.filter(mentee => {
    if (filterOption === 'All') {
      return true;
    } else if (filterOption === 'Scored') {
      return mentee.MarksAssigned;
    } else if (filterOption === 'Unscored') {
      return !mentee.MarksAssigned;
    }
    return true;
  });
  
  
  const generateMarksheet = () => {
    // Define an array to hold the content of the marksheet
    const content = [];
    
    // Add a header for the marksheet
    content.push({ text: 'Marksheet', style: 'header' });
    content.push({ text: '\n\n' });
    
    // Iterate over each mentee and add their name and marks to the content
    mentees.forEach((mentee, index) => {
      const { Name, Ideation, Execution, Viva_Pitch, Additional_Criterion, Total_Marks } = mentee;
      const entryNumber = index + 1; // Calculate the sequential entry number
      const marksInfo = `${entryNumber}. ${Name}: Ideation - ${Ideation}, Execution - ${Execution}, Viva Pitch - ${Viva_Pitch}, Additional Criterion - ${Additional_Criterion}, Total Marks - ${Total_Marks}`;
      content.push({ text: marksInfo });
      content.push({ text: '\n' });
    });
    
    // Define the document definition
    const docDefinition = {
      content: content,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center'
        }
      }
    };
  
    // Generate the PDF
    pdfMake.createPdf(docDefinition).download('marksheets.pdf');
  };
  
  const handleScoreClick = (mentee) => {
    setSelectedMentee(mentee);
    setShowModal(true);
  };

  const sendEmailToStudents = async () => {
    try {
      // Get the emails of assigned students
      const assignedStudentsEmails = mentees.map(mentee => mentee.email);
  
      // Send emails to assigned students
      const response = await axios.post('https://scoremint.onrender.com/send-email', { recipients: assignedStudentsEmails });
      console.log('Emails sent to:', assignedStudentsEmails);
      alert('Emails have been sent to all assigned students.');
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails to students.');
    }
  };
  
  

  const handleRemoveMentee = async (menteeId) => {
    try {
      await axios.post('https://scoremint.onrender.com/remove-mentee', { menteeId });
      setMentees(mentees.filter(mentee => mentee._id !== menteeId));
    } catch (error) {
      console.error('Error removing mentee:', error);
      setError('Failed to remove mentee');
    }
  };

  const generateChartData = (scores) => {
    const { Ideation, Execution, Viva_Pitch, Additional_Criterion } = scores;
    const data = {
      labels: ['Ideation', 'Execution', 'Viva Pitch', 'Additional Criterion'],
      datasets: [{
        data: [Ideation, Execution, Viva_Pitch, Additional_Criterion],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8A2BE2']
      }]
    };
    setChartData(data);
  };
  

  const handleScoreUpdate = async () => {
    try {
      if (
        scores.Ideation === '' ||
        scores.Execution === '' ||
        scores.Viva_Pitch === '' ||
        scores.Additional_Criterion === '' ||
        parseInt(scores.Ideation) > 25 ||
        parseInt(scores.Execution) > 25 ||
        parseInt(scores.Viva_Pitch) > 25 ||
        parseInt(scores.Additional_Criterion) > 25
      ) {
        alert('Please enter valid scores (0 - 25) for all fields');
        return;
      }
  
      const totalMarks = Object.values(scores).reduce((acc, curr) => acc + parseInt(curr), 0);
      if (totalMarks > 100) {
        alert('Total marks cannot exceed 100');
        return;
      }
  
      await axios.post('https://scoremint.onrender.com/update-scores', {
        menteeId: selectedMentee._id,
        scores: { ...scores, Total_Marks: totalMarks }
      });
  
    // Set MarksAssigned to true for the selected mentee
    const updatedMentees = mentees.map(mentee => {
      if (mentee._id === selectedMentee._id) {
        return { ...mentee, marksAssigned: true };
      }
      return mentee;
    });
    setMentees(updatedMentees);

    fetchMentees();
  
      setScores({
        Ideation: '',
        Execution: '',
        Viva_Pitch: '',
        Additional_Criterion: ''
      });
      setSelectedMentee(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating scores:', error);
      setError('Failed to update scores');
    }
  };
  

  const handleViewResultClick = async (menteeId) => {
    try {
      const response = await axios.get(`https://scoremint.onrender.com/mentee-scores/${menteeId}`);
      setFetchedScores(response.data.scores);
      generateChartData(response.data.scores);
      setShowScoreModal(true);
    } catch (error) {
      console.error('Error fetching mentee scores:', error);
    }
  };

  const toggleLockScores = async () => {
    try {
      // Update the marks for selected mentee if any
      if (selectedMentee) {
        await handleScoreUpdate();
      }
  
      // Fetch the latest mentees data
      const response = await axios.get('https://scoremint.onrender.com/mymentees');
      if (!response.data.success) {
        setError('Failed to fetch mentees');
        return;
      }
  
      const menteesData = response.data.mentees;
  
      // Check if any mentee has empty marks
      const hasEmptyMarks = menteesData.some(mentee => {
        console.log(`Mentee ${mentee.Stu_id} marks:`, mentee.Ideation, mentee.Execution, mentee.Viva_Pitch, mentee.Additional_Criterion);
        return (
          mentee.Ideation === '' ||
          mentee.Execution === '' ||
          mentee.Viva_Pitch === '' ||
          mentee.Additional_Criterion === '' ||
          mentee.Ideation === null ||
          mentee.Execution === null ||
          mentee.Viva_Pitch === null ||
          mentee.Additional_Criterion === null ||
          mentee.Ideation === undefined ||
          mentee.Execution === undefined ||
          mentee.Viva_Pitch === undefined ||
          mentee.Additional_Criterion === undefined
        );
      });
  
      console.log('Has empty marks:', hasEmptyMarks);
  
      if (hasEmptyMarks) {
        alert('Cannot lock marks. Some students have empty marks.');
        return;
      }
  
      // Check if there are fewer than 3 mentees
      if (menteesData.length < 3) {
        alert('Cannot lock marks. There must be at least 3 mentees.');
        return;
      }
  
      // Check if all mentees are currently locked
      const allMenteesLocked = menteesData.every(mentee => mentee.marksLocked);
  
      if (allMenteesLocked) {
        alert('Marks are already locked. Cannot unlock.');
        return;
      }
  
      // Get the IDs of mentees visible in the table
      const visibleMenteeIds = menteesData.map(mentee => mentee._id);
  
      // Update the isLocked field for visible mentees
      await axios.post('https://scoremint.onrender.com/lock-all-marks', { menteeIds: visibleMenteeIds });
  
      // Update the isLocked field in the frontend state for visible mentees
      setMentees(menteesData.map(mentee => (
        visibleMenteeIds.includes(mentee._id)
          ? { ...mentee, marksLocked: true }
          : mentee
      )));
  
      setIsLocked(true);
      setCanToggleLock(false); // Once locked, cannot be unlocked
    } catch (error) {
      console.error('Error toggling lock scores:', error);
      setError('Failed to toggle lock scores');
    }
  };
  
  
  const ScoreModal = () => {
    return (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => setShowScoreModal(false)}>×</span>
          <h2>Mentee Scores</h2>
          <div>
            <p>Ideation: {fetchedScores.Ideation}</p>
            <p>Execution: {fetchedScores.Execution}</p>
            <p>Viva Pitch: {fetchedScores.Viva_Pitch}</p>
            <p>Additional Criterion: {fetchedScores.Additional_Criterion}</p>
            <p>Total Marks: {fetchedScores.Total_Marks}</p>
          </div>
          <div>
            <Pie data={chartData} />
          </div>
          <button onClick={() => setShowScoreModal(false)}>Close</button>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>My Mentees View</h1>
      
      <div>
        <label>Filter by Marks Assigned:</label>
        <select value={filterOption} onChange={handleFilterChange}>
          <option value="All">All</option>
          <option value="Scored">Scored</option>
          <option value="Unscored">Unscored</option>
        </select>
      </div>
      {!isLoading && filteredMentees.length > 0 && (
        <button className="button" onClick={toggleLockScores}> 
          {isLocked ? "Everything is 🔏🔏" : "Lock All Marks"}
        </button>
      )}
      <div className="buttons-container">
      {!isLoading && filteredMentees.length > 0 && isLocked && (
        <button className="button2"  onClick={generateMarksheet}>Download Marksheet</button>
      )}
       {/* Button to send emails to assigned students */}
       {!isLoading && filteredMentees.length > 0 && isLocked && (
        <button  className="button3" onClick={sendEmailToStudents}>Send Evaluation Completed Emails</button>
      )}
      </div>
{error && <p>{error}</p>}
{isLoading ? (
  <p>Loading...</p>
) : (
  <table className="table table-bordered">
    <thead>
      <tr>
        <th>Student ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Score</th>
        <th>Actions</th>
        <th>View Result</th>
        <th>Marks Assigned</th> {/* New column */}
      </tr>
    </thead>
    <tbody>
      {filteredMentees.map(mentee => (
        <tr key={mentee._id}>
          <td>{mentee.Stu_id}</td>
          <td>{mentee.Name}</td>
          <td>{mentee.email}</td>
          <td>
            {isLocked ? (
              <span role="img" aria-label="Locked" style={{ color: 'green' }}>🔒</span>
            ) : (
              <button onClick={() => handleScoreClick(mentee)} disabled={mentee.marksLocked}>Add/Update Score</button>
            )}
          </td>
          <td>
            {isLocked ? (
              <span role="img" aria-label="Locked" style={{ color: 'green' }}>⛓️</span>
            ) : (
              <button onClick={() => handleRemoveMentee(mentee._id)} disabled={mentee.marksLocked}>Remove</button>
            )}
          </td>
          <td>
            <button onClick={() => handleViewResultClick(mentee._id)}>View Result</button>
          </td>
          <td>{mentee.marksAssigned}</td> {/* Display "Yes" or "No" based on marksAssigned */}
        </tr>
      ))}
    </tbody>
  </table>
)}

      {selectedMentee && showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>×</span>
            <h2>Update Scores (Out of 25)</h2>
            <div>
              <label>Ideation:</label>
              <input
                type="number"
                value={scores.Ideation}
                onChange={(e) => setScores({ ...scores, Ideation: e.target.value })}
                min="0"
                max="25"
                disabled={selectedMentee.marksLocked}
              />
            </div>
            <div>
              <label>Execution:</label>
              <input
                type="number"
                value={scores.Execution}
                onChange={(e) => setScores({ ...scores, Execution: e.target.value })}
                min="0"
                max="25"
                disabled={selectedMentee.marksLocked}
              />
            </div>
            <div>
              <label>Viva Pitch:</label>
              <input
                type="number"
                value={scores.Viva_Pitch}
                onChange={(e) => setScores({ ...scores, Viva_Pitch: e.target.value })}
                min="0"
                max="25"
                disabled={selectedMentee.marksLocked}
              />
            </div>
            <div>
              <label>Additional Criterion:</label>
              <input
                type="number"
                value={scores.Additional_Criterion}
                onChange={(e) => setScores({ ...scores, Additional_Criterion: e.target.value })}
                min="0"
                max="25"
                disabled={selectedMentee.marksLocked}
              />
            </div>
            <button onClick={handleScoreUpdate} disabled={selectedMentee.marksLocked}>Update</button>
          </div>
        </div>
      )}
      {showScoreModal && <ScoreModal />}
    </div>
  );
}

export default MyMenteesView;
