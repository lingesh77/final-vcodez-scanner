const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const { connectDB, newclient } = require("./monogodbconnection");
const Trainer = require('./Trainerschema');
const Batch = require('./Batcheschema');
const Student = require('./Studentschema');
const Attendances = require('./Attendanceschema');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
connectDB();
app.post('/trainerdetails', async (req, res) => {
    const {    trainer_id,
                trainer_name,
                trainer_email,
                trainer_domains } = req.body;
    console.log('Received Register Data:', trainer_id);

    try {
        const db= newclient.db("vcodez");
        const collection = db.collection("trainers");
        const newTrainer =await new Trainer({
            trainer_id:trainer_id,

            trainer_name:trainer_name,
            trainer_email:trainer_email,
            trainer_domains:trainer_domains,
        });
        await collection.insertOne(newTrainer);

        res.status(201).json({ message: 'Trainer details saved successfully', trainer: newTrainer });
    } catch (error) {
        console.error('Error saving trainer details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


});

app.post('/createbatch', async (req, res) => {
    const { user_data,newBatch} = req.body;
console.log('Received Batch Data:',newBatch);
const students=newBatch.students.map((item)=>({
        student_id:item.studentId,
        student_name:item.student_name,
        student_email:item.student_email,
        student_phone_number:item.student_phone_number,
        student_domain:item.student_domain,
        trainer_id:user_data.trainer_id,
        batch_id:newBatch.id,



    }))
  const batch={
    batch_id:newBatch.id,
    session:newBatch.title,
    domain:newBatch.domain,
    status:newBatch.status,
    batch_schedule:newBatch.schedule,
    trainer_id:user_data.trainer_id,
    students:newBatch.students.map((item)=>item.studentId),
    CreatedAt:newBatch.createdAt,

  }
  console.log('Processed Students Data:',students);
  console.log('Processed Batch Data:',batch);
    try {
        const db= newclient.db("vcodez");
        const batchCollection = db.collection("batches");
        const studentCollection = db.collection("students");
        const trainerCollection = db.collection("trainers");
        

        const newBatchDoc =await new  Batch(batch);
        const validatestudents= students.map((doc) => new Student(doc).toObject());
        await batchCollection.insertOne(newBatchDoc);
        await trainerCollection.updateOne(
            { trainer_id: user_data.trainer_id },
            { $push: { batches: newBatch.id } }

        )

    
        

        await studentCollection.insertMany(validatestudents);
        
       
        res.status(201).json({ message: 'Batch and student details saved successfully'})
        
        



    }
    catch(error){
        console.error('Error saving batch details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


        
      
    
    

});
app.post('/getbatches', async (req, res) => {
    const { trainer_id } = req.body;
    console.log('Received Trainer ID for fetching batches:', trainer_id);

    try {
        const db= newclient.db("vcodez");
        const batchCollection = db.collection("batches");
        const batches = await batchCollection.find({ trainer_id: trainer_id }).toArray();
        console.log('Fetched Batches:', batches);
        res.status(200).json({ batches: batches });
    }
        
        catch (error) {
            console.error('Error fetching batches:', error);
            res.status(500).json({ message: 'Internal server error' });
            
        }
        
});

app.post('/getstudents', async (req, res) => {
    const { batch_id,trainer_id } = req.body;
    console.log('Received Batch ID for fetching students:', batch_id)
    console.log('Received Trainer ID for fetching students:', trainer_id)

    try {
        const db= newclient.db("vcodez");
        const studentCollection = db.collection("students");
      if(!batch_id){
          const students = await studentCollection.find({ trainer_id: trainer_id }).toArray();
                            res.status(200).json({ students: students });

      }
                    const students = await studentCollection.find({ batch_id: batch_id }).toArray();
                            res.status(200).json({ students: students });
                                    console.log('Fetched Students:', students);




        
    
    }
        
        catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ message: 'Internal server error' });
            
        }
});
 
app.post('/addattendance', async (req, res)=>{
    const{ presentStudents,absentStudents,trainer_id,}= req.body;
    const Attendance = [
        ...presentStudents.map((student) => ({
            student_id: student.student_id,
            status: student.status,
            attandance_date: student.scannedDate,
            batch_id: student.batch_id,
            domain: student.student_domain,
            trainer_id:trainer_id,
        })),
        ...absentStudents.map((student) => ({
            student_id: student.student_id,
            status: student.status,
            attandance_date: student.scannedDate,
            batch_id: student.batch_id,
            domain: student.student_domain,
            trainer_id:trainer_id,

        })),
    ];
    try {
        const db= newclient.db("vcodez");
        const attendanceCollection = db.collection("attendances");
    const validatedDocs = Attendance.map((doc) => new Attendances(doc).toObject());
        await attendanceCollection.insertMany(validatedDocs);
        res.status(201).json({ message: 'Attendance details saved successfully'});

    }
        catch(error){
            console.error('Error saving attendance details:', error);
            res.status(500).json({ message: 'Internal server error' });
        }

    






});

app.post('/getbatches', async (req, res)=>{
    const { trainer_id,batch_id } = req.body;
    console.log('Received Trainer ID for fetching batches:', trainer_id);

    try {
        const db= newclient.db("vcodez");
        const batchCollection = db.collection("batches");
        const batches = await batchCollection.find({ trainer_id: trainer_id,batch_id:batch_id }).toArray();
        res.status(200).json({ batches: batches });
    }
        
        catch (error) {
            console.error('Error fetching batches:', error);
            res.status(500).json({ message: 'Internal server error' });
            
        }

})

app.post('/getattendance', async (req, res)=>{
    const { batch_id,attandance_date,trainer_id } = req.body;
    console.log('Received Batch ID for fetching attendance:', batch_id);
    console.log('Received Date for fetching attendance:', attandance_date);
    console.log('Received Trainer for fetching the attendance: ',trainer_id)
        const start = new Date(attandance_date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(attandance_date);
    end.setUTCHours(23, 59, 59, 999);

    try {
        const db= newclient.db("vcodez");
        const attendanceCollection = db.collection("attendances");
     /*    if(!batch_id ){
             const attendance = await attendanceCollection.find({ trainer_id: trainer_id,
                attandance_date:{
            $gte: start,
            $lte: end
        }
              }).toArray();
            console.log("attendance",attendance)
            res.status(200).json({ attendance: attendance });


        } */
        
        if(!attandance_date){
            if(!batch_id){
            const attendance = await attendanceCollection.find({ trainer_id: trainer_id }).toArray();
            console.log("attendance",attendance)
            res.status(200).json({ attendance: attendance });


            }
            
            const attendance = await attendanceCollection.find({ batch_id: batch_id }).toArray();
            res.status(200).json({ attendance: attendance });
            return;
        }
        const attendance = await attendanceCollection.find({ batch_id: batch_id,attandance_date:{
            $gte: start,
            $lte: end
        } }).toArray();
        res.status(200).json({ attendance: attendance });
    }
        
        catch (error) {
            console.error('Error fetching attendance:', error);
            res.status(500).json({ message: 'Internal server error' });
            
        }
    
})
app.post('/updateattendance',async(req,res)=>{
    const { student_id,attendance_records,newdate,newstatus,trainer_id,batch_id,domain}= req.body;
    console.log('Received Student ID for updating attendance:', student_id,attendance_records);
    try{
        const db= newclient.db("vcodez");
        const attendanceCollection = db.collection("attendances");
        if(newdate && newstatus){
            const start = new Date(newdate);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(newdate);
            end.setUTCHours(23, 59, 59, 999);
            await attendanceCollection.insertOne(
                {
                    student_id: student_id,
                    status: newstatus,
                    attandance_date: new Date(newdate),
                    batch_id:batch_id,
                    domain:domain,
                    trainer_id:trainer_id,
                }
            )}
                {
                    
        }
        for (const record of attendance_records) {
            const { attandance_date, status } = record;
            const start = new Date(attandance_date);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(attandance_date);
            end.setUTCHours(23, 59, 59, 999);
            await attendanceCollection.updateOne(
                {
                    student_id: student_id,
                    attandance_date: { $gte: start, $lte: end }
                },
                { $set: { status: status } }
            );

        }
            
            res.status(200).json({ message: 'Attendance updated successfully' });

    }catch(error){
        console.error('Error updating attendance:', error);
            res.status(500).json({ message: 'Internal server error' });
    }
    
})

app.post('/addstudent', async (req, res)=>{
    const { student,trainer_id} = req.body;
    const studentData={
        student_id:student.student_id,
        student_name:student.student_name,
        student_email:student.student_email,
        student_phone_number:Number(student.student_phone),
        student_domain:student.student_domain,
        trainer_id:trainer_id,
        batch_id:student.batch_id,}
        console.log('Received Student Data:',studentData)
    try {
        const db= newclient.db("vcodez");
        const studentCollection = db.collection("students");
        const batchCollection = db.collection("batches");
        const newStudentDoc =new Student(studentData);
        await studentCollection.insertOne(newStudentDoc);
        await batchCollection.updateOne(
            { batch_id: student.batch_id },
            { $push: { students: student.student_id } }

        )
        res.status(201).json({ message: 'Student details saved successfully'})
    }
    catch(error){
        console.error('Error saving student details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
        

})
app.post('/updatestudentdetails', async (req, res)=>{
    const { student_id,student_email,student_phone_number,batch_id,previous_batch_id} = req.body;
    console.log('Received Student Data for update:',student_id,student_email,student_phone_number,batch_id,previous_batch_id)
    try {
        const db= newclient.db("vcodez");
        const studentCollection = db.collection("students");
        const batchCollection = db.collection("batches");
        const attdancecollection= db.collection("attendances");

        if(batch_id){
            const student = await studentCollection.findOne({ student_id: student_id });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            const present_batch=await batchCollection.findOne({ batch_id: batch_id }); 
            console.log("present batch", present_batch.domain)
   await batchCollection.updateOne(
                { batch_id: previous_batch_id },
                { $pull: { students: student_id } }

            );
            await batchCollection.updateOne(
                { batch_id: batch_id },
                { $push: { students: student_id } },


            )
            await attdancecollection.updateMany(
                { student_id: student_id },
                { $set: { batch_id: batch_id,student_domain: present_batch.domain } },

            );
            await studentCollection.updateOne(
                { student_id: student_id },
                { $set: { batch_id: batch_id,student_domain: present_batch.domain },
             },
          

            ); 
            
            res.status(200).json({ message: 'Student details updated successfully'})

        }
        await studentCollection.updateOne(
            { student_id: student_id },
            { $set: { student_email: student_email,student_phone_number: Number(student_phone_number)} }
        );

        res.status(200).json({ message: 'Student details updated successfully'})
    }
    catch(error){
        console.error('Error updating student details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

})
app.post('/deletestudent', async (req, res)=>{
    const { student_id} = req.body;
    console.log('Received Student ID for deletion:',student_id)
    try {
        const db= newclient.db("vcodez");
        const studentCollection = db.collection("students");
        const batchCollection = db.collection("batches");
        const attdancecollection= db.collection("attendances");
        const student = await studentCollection.findOne({ student_id: student_id });


        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await studentCollection.deleteOne({ student_id: student_id });
        await batchCollection.updateOne(
            { batch_id: student.batch_id },
            { $pull: { students: student_id } }

        );
        await attdancecollection.deleteMany({ student_id: student_id });
        res.status(200).json({ message: 'Student deleted successfully'})
    }
    catch(error){
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.post('/getattadancefordashboard',async(req,res)=>{
    const {attandance_date,trainer_id}=req.body
    console.log("dashboard attadance:",attandance_date,trainer_id)
     const start = new Date(attandance_date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(attandance_date);
    end.setUTCHours(23, 59, 59, 999);
    try{
         const db= newclient.db("vcodez");
        const attendanceCollection = db.collection("attendances");
         const attendance = await attendanceCollection.find({ trainer_id: trainer_id,
                attandance_date:{
            $gte: start,
            $lte: end
        }
              }).toArray();
            console.log("attendance for dashboard",attendance)
            res.status(200).json({ attendance: attendance });
    }
    catch(error){
         console.error('Error fetching attendance:', error);
            res.status(500).json({ message: 'Internal server error' });
        
    }
    
})

app.post('/addstudentattendance', async (req, res) => {
  const { student_id, attandance_date, status, batch_id, domain, trainer_id } = req.body;
  console.log('Received Student Attendance Data:', student_id, attandance_date, status, batch_id, domain, trainer_id);

  try {
    const db = newclient.db("vcodez");
    const attendanceCollection = db.collection("attendances");

    // Step 1: Check if attendance already exists for the same student on the same date
    const existingAttendance = await attendanceCollection.findOne({
      student_id: student_id,
      attandance_date: new Date(attandance_date)  // match exact date
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: 'Attendance already marked for student on this date'
      });
    }

    // Step 2: Insert if not found
    const newAttendanceDoc = {
      student_id: student_id,
      status: status,
      attandance_date: new Date(attandance_date),
      batch_id: batch_id,
      domain: domain,
      trainer_id: trainer_id,
    };

    await attendanceCollection.insertOne(newAttendanceDoc);

    res.status(201).json({ message: 'Attendance details saved successfully' });

  } catch (error) {
    console.error('Error saving attendance details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on ${process.env.PORT}`);
});