const express = require('express');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection string
const uri = 'mongodb+srv://divyanshu1072be21:Harsh%40123@student.4bvhhxl.mongodb.net/';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// Connect to MongoDB Atlas
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        await printDatabaseValues(); // Call function to print database values
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
    }
}

// Function to print all possible values stored in the database
async function printDatabaseValues() {
    try {
        const database = client.db('records');
        const collection = database.collection('mentor-data');
        const values = await collection.find({}).toArray();
        console.log('Values stored in database:');
        console.log(values);
    } catch (error) {
        console.error('Error fetching database values:', error);
    }
}

let loggedInMentorName=''
app.post('/login', async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({ success: false, message: 'Username or password missing in request body' });
    }
    const { username, password } = req.body;
  
    try {
      const database = client.db('records');
      const collection = database.collection('mentor-data');
  
      // Find a document with the provided Mentorid (username)
      const mentor = await collection.findOne({ Mentorid: username });
  
      // If mentor exists and the provided password matches the stored password
      if (mentor && mentor.Password === password) {
        console.log(`Successful login for username: ${username}`);

        // Store the logged-in mentor name in the global variable
        loggedInMentorName = mentor.Name;
  
        // Send the name of the logged-in user along with the success flag
        res.json({ success: true, name: mentor.Name });
      } else {
        console.log(`Failed login for username: ${username}`);
        res.json({ success: false });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

// In your /pick-mentees endpoint, use the global variable loggedInMentorName

app.post('/pick-mentees', async (req, res) => {
    const { selectedStudents } = req.body;
  
    try {
      if (!loggedInMentorName) {
        return res.status(400).json({ success: false, message: 'Mentor name is missing' });
      }
  
      const database = client.db('records');
      const studentsCollection = database.collection('students-data');
  
      // Update the status and assigned mentor for each selected student
      const updatePromises = selectedStudents.map(async (studentId) => {
        await studentsCollection.updateOne(
          { _id: new ObjectId(studentId), Status: "Unassigned" },
          { $set: { Status: "Assigned", "Assigned Mentor": loggedInMentorName } }
        );
      });
  
      // Wait for all updates to complete
      await Promise.all(updatePromises);
  
      res.json({ success: true, message: 'Mentees assigned successfully' });
      return ;
    } catch (error) {
      console.error('Error picking mentees:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

// Endpoint to lock the marks for specified mentees
app.post('/lock-all-marks', async (req, res) => {
  const { menteeIds } = req.body;

  try {
    const database = client.db('records');
    const collection = database.collection('students-data');

    // Update the isLocked field for the specified mentees
    await collection.updateMany(
      { _id: { $in: menteeIds.map(id => new ObjectId(id)) } },
      { $set: { isLocked: true } }
    );

    res.json({ success: true, message: 'Marks locked successfully' });
  } catch (error) {
    console.error('Error locking marks:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Endpoint to send evaluation completion emails to all assigned students
app.post('/send-evaluation-emails', async (req, res) => {
  try {
    const { mentorName, assignedStudentsEmails } = req.body;

    // Call the function to send emails to assigned students
    await sendEmailToStudents(mentorName, assignedStudentsEmails);

    res.json({ success: true, message: 'Evaluation completion emails sent successfully' });
  } catch (error) {
    console.error('Error sending evaluation completion emails:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// Route to send email to assigned students
app.post('/send-email', async (req, res) => {
  const { recipients } = req.body; // Extract recipients from the request body

  try {
    // Call the function to send emails to assigned students
    await sendEmailToStudents(recipients);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Function to send email to all assigned students
async function sendEmailToStudents(recipients) {
  try {
    // Setup Nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'choudhardiv@gmail.com', // Your Gmail email address
        pass: 'sytrirtyxhgufoyk' // Your Gmail password
      }
    });

    // Email content
    const mailOptions = {
      from: 'choudhardiv@gmail.com', // Sender address
      to: recipients.join(','), // Recipient email addresses separated by commas
      subject: 'Evaluation Completed', // Subject line
      text: 'Dear Student,\n\nYour evaluation has been completed by your mentor. Please check the results.\n\nRegards,\nScoreMint Team' // Plain text body
    };

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Propagate the error to the caller
  }
}

  
  
  app.get('/mymentees', async (req, res) => {
    try {
        
       
        // Check if the logged-in mentor's name is available
        if (!loggedInMentorName) {
            return res.status(400).json({ success: false, message: 'Mentor name is missing' });
        }

        // Retrieve data for mentees assigned to the logged-in mentor
        const database = client.db('records');
        const studentsCollection = database.collection('students-data');
        const assignedMentees = await studentsCollection.find({ "Assigned Mentor": loggedInMentorName }).toArray();

        // Return the filtered data as a response
        res.json({ success: true, mentees: assignedMentees });
    } catch (error) {
        console.error('Error fetching mentees assigned to the mentor:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

  



// Route to fetch all students
app.get('/allstudents', async (req, res) => {
    try {
        const database = client.db('records');
        const studentsCollection = database.collection('students-data');
        const students = await studentsCollection.find({}).toArray();
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to update scores for a mentee
app.post('/update-scores', async (req, res) => {
  const { menteeId, scores } = req.body;

  try {
    const database = client.db('records');
    const collection = database.collection('students-data');

    // Calculate the total marks
    const totalMarks = parseInt(scores.Ideation) + parseInt(scores.Execution) + parseInt(scores.Viva_Pitch) + parseInt(scores.Additional_Criterion);
    
    // Update the scores and total marks for the specified mentee
    await collection.updateOne(
      { _id: new ObjectId(menteeId) },
      { 
        $set: { 
          Ideation: scores.Ideation,
          Execution: scores.Execution,
          Viva_Pitch: scores.Viva_Pitch,
          Additional_Criterion: scores.Additional_Criterion,
          Total_Marks: totalMarks,
          MarksAssigned: true // Set MarksAssigned to true
        } 
      }
    );

    res.json({ success: true, message: 'Scores updated successfully' });
  } catch (error) {
    console.error('Error updating scores:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Endpoint to fetch scores for a mentee
app.get('/mentee-scores/:menteeId', async (req, res) => {
    const { menteeId } = req.params;
  
    try {
      const database = client.db('records');
      const collection = database.collection('students-data');
  
      // Find the mentee with the provided menteeId
      const mentee = await collection.findOne({ _id: new ObjectId(menteeId) });
  
      // If mentee is found, return the scores
      if (mentee) {
        const { Ideation, Execution, Viva_Pitch, Additional_Criterion, Total_Marks } = mentee;
        res.json({ success: true, scores: { Ideation, Execution, Viva_Pitch, Additional_Criterion, Total_Marks } });
      } else {
        res.status(404).json({ success: false, message: 'Mentee not found' });
      }
    } catch (error) {
      console.error('Error fetching mentee scores:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

// Endpoint to toggle the lock state of mentee scores
app.post('/toggle-lock-scores', async (req, res) => {
    const { menteeId, marksLocked } = req.body;

    try {
        const database = client.db('records');
        const collection = database.collection('students-data');

        // Update the marksLocked field for the specified mentee
        await collection.updateOne(
            { _id: new ObjectId(menteeId) },
            { $set: { marksLocked } }
        );

        res.json({ success: true, message: 'Lock state updated successfully' });
    } catch (error) {
        console.error('Error toggling lock state:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Endpoint to count the number of entries displayed in mymentees endpoint
app.get('/count-my-mentees', async (req, res) => {
    try {
        // Check if the logged-in mentor's name is available
        if (!loggedInMentorName) {
            return res.status(400).json({ success: false, message: 'Mentor name is missing' });
        }

        // Retrieve data for mentees assigned to the logged-in mentor
        const database = client.db('records');
        const studentsCollection = database.collection('students-data');
        const count = await studentsCollection.countDocuments({ "Assigned Mentor": loggedInMentorName });

        // Return the count as a response
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error counting mentees assigned to the mentor:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


  


// Endpoint to remove a mentee
app.post('/remove-mentee', async (req, res) => {
    const { menteeId } = req.body;
  
    try {
      const database = client.db('records');
      const collection = database.collection('students-data');
  
      // Update the status to "Unassigned" and clear the "Assigned Mentor" field
      await collection.updateOne(
        { _id: new ObjectId(menteeId) },
        { $set: { Status: "Unassigned", "Assigned Mentor": "" } }
      );
  
      res.json({ success: true, message: 'Mentee status updated successfully' });
    } catch (error) {
      console.error('Error updating mentee status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


  





// Start the server
async function startServer() {
    await connectToMongoDB();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

startServer();
