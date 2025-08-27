import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, X, User, Mail, Calendar, BookOpen, TrendingUp, Plus, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import QRCodeLib from 'qrcode';

export default function StudentDatabase(props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState({});
  const [previousbatchId, setPreviousBatchId] = useState(null);
  const [editingStudentDetails, setEditingStudentDetails] = useState({
    student_email: '',
    student_phone_number: '',
    batch_id: ''
  });
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    student_name: '',
    student_email: '',
    student_phone: '',
    batch_id: '',
    student_domain: ''
  });
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [batchChangedQRCode, setBatchChangedQRCode] = useState(null);
  const [isBatchChanged, setIsBatchChanged] = useState(false);

  const studentsPerPage = 7;

  const generateUniqueStudentId = () => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VCS${randomNum}`;
  };

  const generateQRCode = async (studentData, batchInfo) => {
    const qrData = {
      student_id: studentData.student_id,
      student_name: studentData.student_name,
      batch_id: batchInfo.batch_id,
      batch_name: batchInfo.session,
      domain: batchInfo.domain,
      timings: batchInfo.batch_schedule || 'Not specified',
    };
    const qrText = JSON.stringify(qrData);

    try {
      const qrDataURL = await QRCodeLib.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          const qrSize = 300;
          const textHeight = 70;

          canvas.width = qrSize;
          canvas.height = qrSize + textHeight;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img, 0, 0, qrSize, qrSize);

          ctx.fillStyle = '#666666';
          ctx.font = 'bold 14px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`ID: ${studentData.student_id}`, qrSize / 2, qrSize + 20);

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(studentData.student_name, qrSize / 2, qrSize + 45);

          const finalDataUrl = canvas.toDataURL('image/png');

          resolve({
            studentId: studentData.student_id,
            studentName: studentData.student_name,
            imageDataUrl: finalDataUrl,
            imageName: `${studentData.student_id}_${studentData.student_name.replace(/\s+/g, '_')}_QR.png`
          });
        };
        img.src = qrDataURL;
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'bg-green-100 text-green-800';
    if (rate >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const calculateAttendanceRate = (studentId) => {
    const studentAttendanceRecords = markedAttendance.filter(
      attendance => attendance.student_id === studentId
    );
    if (studentAttendanceRecords.length === 0) return 0;
    const presentCount = studentAttendanceRecords.filter(
      attendance => attendance.status === 'Present'
    ).length;
    return Math.round((presentCount / studentAttendanceRecords.length) * 100);
  };

  const getStudentsWithAttendanceRates = () => {
    return students.map(student => ({
      ...student,
      calculatedAttendanceRate: calculateAttendanceRate(student.student_id)
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUniqueAttendanceDates = () => {
    const uniqueDates = [...new Set(markedAttendance.map(attendance => attendance.attandance_date))];
    return uniqueDates.sort((a, b) => new Date(b) - new Date(a));
  };

  const filteredStudents = getStudentsWithAttendanceRates().filter(student => {
    const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === null || student.batch_id === selectedBatch.batch_id;
    let matchesAttendanceDate = true;
    if (selectedAttendanceDate) {
      matchesAttendanceDate = markedAttendance.some(attendance =>
        attendance.student_id === student.student_id &&
        attendance.attandance_date === selectedAttendanceDate
      );
    }
    return matchesSearch && matchesBatch && matchesAttendanceDate;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch, selectedAttendanceDate]);

  useEffect(() => {
    const fetchattendance = async () => {
      try {
        if (!selectedBatch) {
          const response = await axios.post('http://localhost:5000/getattendance', {
            trainer_id: props.user.trainer_id,
          });
          if (response.data.attendance) {
            setMarkedAttendance(response.data.attendance);
          }
        } else {
          const response = await axios.post('http://localhost:5000/getattendance', {
            batch_id: selectedBatch ? selectedBatch.batch_id : null,
          });
          if (response.data.attendance) {
            setMarkedAttendance(response.data.attendance);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance data. Please try again.');
      }
    };
    fetchattendance();
  }, [selectedBatch]);

  const fetchStudents = async () => {
    try {
      if (!selectedBatch) {
        const response = await axios.post('http://localhost:5000/getstudents', {
          trainer_id: props.user.trainer_id,
        });
        if (response.data.students) {
          setStudents(response.data.students);
        }
      } else {
        const response = await axios.post('http://localhost:5000/getstudents', {
          batch_id: selectedBatch ? selectedBatch.batch_id : null,
        });
        if (response.data.students) {
          setStudents(response.data.students);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students data. Please try again.');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBatch]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getbatches', {
          trainer_id: props.user.trainer_id,
        });
        if (response.data.batches) {
          setBatches(response.data.batches);
          setPreviousBatchId(response.data.batches[0]?.batch_id || null);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        toast.error('Failed to load batches. Please try again.');
      }
    };
    fetchBatches();
  }, []);
  useEffect(() => {
    setSelectedAttendanceDate(null);
  }, [selectedBatch]);

  const Card = ({ children, className = "" }) => (
    <div className={`rounded-lg border bg-white text-slate-900 shadow-sm ${className}`}>
      {children}
    </div>
  );

  const handleBatchChange = (batchId) => {
    if (!batchId) {
      setSelectedBatch(null);
      return;
    }
    const batch = batches.find((b) => b.batch_id === batchId);
    setSelectedBatch(batch);
  };

  const handleAttendanceDateChange = (date) => {
    setSelectedAttendanceDate(date === '' ? null : date);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setBatchChangedQRCode(null);
    setIsBatchChanged(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setIsEditMode(false);
    setEditingAttendance({});
    setEditingStudentDetails({ 
      student_email: '', 
      student_phone_number: '',
      batch_id: ''
    });
    setBatchChangedQRCode(null);
    setIsBatchChanged(false);
  };

  const handleEditStudent = () => {
    setIsEditMode(true);
    const studentAttendance = getStudentAttendanceHistory(selectedStudent.student_id);
    const attendanceMap = {};
    studentAttendance.forEach((record, index) => {
      attendanceMap[index] = {
        attandance_date: record.attandance_date,
        status: record.status,
      };
    });
    setEditingAttendance(attendanceMap);
    setEditingStudentDetails({
      student_email: selectedStudent.student_email,
      student_phone_number: selectedStudent.student_phone_number || '',
      batch_id: selectedStudent.batch_id
    });
    toast.info('Edit mode enabled. Make your changes and save.');
  };

  // Handle batch change in edit mode
  const handleEditBatchChange = async (newBatchId) => {
    const previousBatchId = editingStudentDetails.batch_id;

    setEditingStudentDetails(prev => ({
      ...prev,
      batch_id: newBatchId
    }));

    // Check if batch actually changed
    if (newBatchId !== selectedStudent.batch_id) {
      setIsBatchChanged(true);

      // Generate new QR code with updated batch information
      try {
        const newBatch = batches.find(b => b.batch_id === newBatchId);
        if (newBatch) {
          const updatedStudentData = {
            ...selectedStudent,
            batch_id: newBatchId
          };

          const newQRCode = await generateQRCode(updatedStudentData, newBatch);
          if (newQRCode) {
            setBatchChangedQRCode(newQRCode);
            toast.success('New QR code generated for batch change!');
          }
        }
      } catch (error) {
        console.error('Error generating QR code for batch change:', error);
        toast.error('Failed to generate new QR code');
      }
    } else {
      setIsBatchChanged(false);
      setBatchChangedQRCode(null);
    }
  };

  // Edit mode: update attendance history and/or details
  const handleSaveChanges = async () => {
    try {
      const newAttendance = Object.values(editingAttendance);
      let updatedAttendance = [...markedAttendance];
      newAttendance.forEach(updatedRecord => {
        updatedAttendance = updatedAttendance.map(att => {
          if (
            att.student_id === selectedStudent.student_id &&
            att.attandance_date === updatedRecord.attandance_date
          ) {
            return {
              ...att,
              status: updatedRecord.status,
            };
          }
          return att;
        });
      });
      setMarkedAttendance(updatedAttendance);
      setIsEditMode(false);

      let attendanceUpdated = false;
      let detailsUpdated = false;

      try {
        // Update Attendance History
        const response = await axios.post('http://localhost:5000/updateattendance', {
          student_id: selectedStudent.student_id,
          attendance_records: newAttendance,
        });

        if (response.data.message === 'Attendance updated successfully') {
          attendanceUpdated = true;
        }

        // Update Student Details if changed
        if (
          editingStudentDetails.student_email !== selectedStudent.student_email ||
          editingStudentDetails.student_phone_number !== selectedStudent.student_phone_number ||
          editingStudentDetails.batch_id !== selectedStudent.batch_id
        ) {
          const updateResponse = await axios.post('http://localhost:5000/updatestudentdetails', {
            student_id: selectedStudent.student_id,
            student_email: editingStudentDetails.student_email,
            student_phone_number: editingStudentDetails.student_phone_number,
            batch_id: editingStudentDetails.batch_id,
            previous_batch_id: previousbatchId
          });

          if (updateResponse.data.message === 'Student details updated successfully') {
            detailsUpdated = true;
            fetchStudents();

            // Update the selected student with new details
            const updatedBatch = batches.find(b => b.batch_id === editingStudentDetails.batch_id);
            setSelectedStudent(prev => ({
              ...prev,
              student_email: editingStudentDetails.student_email,
              student_phone_number: editingStudentDetails.student_phone_number,
              batch_id: editingStudentDetails.batch_id,
              student_domain: updatedBatch ? updatedBatch.domain : prev.student_domain
            }));
            // Download QR code if batch was changed
            if (isBatchChanged && batchChangedQRCode) {
              downloadBatchChangedQRCode();
              toast.success('Changes saved and new QR code downloaded!');
            } else {
              toast.success('Changes updated successfully');
            }
          }
        } else {
          toast.success('Changes updated successfully');
        }

        // Reset batch change tracking
        setIsBatchChanged(false);
        setBatchChangedQRCode(null);

      } catch (error) {
        console.error('Error updating data:', error);
        toast.error('Failed to save changes');
      }

    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    }
  };

  // NEW: Attendance update function, only for adding one day's attendance entry!
  const updateAttendance = async () => {
  if (!newAttendanceDate) {
    toast.error('Please select a date');
    return;
  }

  try {
    const response = await axios.post('http://localhost:5000/addstudentattendance', {
      student_id: selectedStudent.student_id,
      attandance_date: newAttendanceDate,
      status: newAttendanceStatus,
      trainer_id: props.user.trainer_id,
      batch_id: selectedStudent.batch_id,
      domain: selectedStudent.student_domain
    });

    if (response.status === 201 && response.data.message === 'Attendance details saved successfully') {
      toast.success('Attendance added!');
      setMarkedAttendance(prev => [
        ...prev,
        {
          student_id: selectedStudent.student_id,
          attandance_date: newAttendanceDate,
          status: newAttendanceStatus,
        }
      ]);
      setNewAttendanceDate('');
      setNewAttendanceStatus('Present');
    } else {
      toast.error(response.data.message || 'Failed to add attendance');
    }
  } catch (error) {
    if (error.response && error.response.data.message) {
      toast.error(error.response.data.message); // e.g. "Attendance already marked..."
    } else {
      toast.error('Error adding attendance');
    }
  }
};


  const downloadBatchChangedQRCode = () => {
    if (batchChangedQRCode) {
      const link = document.createElement('a');
      link.href = batchChangedQRCode.imageDataUrl;
      link.download = batchChangedQRCode.imageName;
      link.click();
    }
  };

  const handleDeleteStudent = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedStudent.student_name}? This action cannot be undone.`)) {
      try {
        const response = await axios.post('http://localhost:5000/deletestudent', {
          student_id: selectedStudent.student_id
        });

        if (response.data.message === 'Student deleted successfully') {
          toast.success(`${selectedStudent.student_name} deleted successfully`);
          fetchStudents();
          closeModal();
        } else {
          toast.error('Failed to delete student');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student. Please try again.');
      }
    }
  };

  const handleAttendanceChange = (index, status) => {
    setEditingAttendance(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        status: status,
      },
    }));
  };

  const getStudentAttendanceHistory = (studentId) => {
    return markedAttendance
      .filter(attendance => attendance.student_id === studentId)
      .sort((a, b) => new Date(b.attandance_date) - new Date(a.attandance_date));
  };

  // Add Student Modal functions
  const handleAddStudentFormChange = (field, value) => {
    setAddStudentForm(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'batch_id' && value) {
      const selectedBatch = batches.find(batch => batch.batch_id === value);
      if (selectedBatch) {
        setAddStudentForm(prev => ({
          ...prev,
          student_domain: selectedBatch.domain
        }));
      }
    }
  };

  const handleGenerateQRForNewStudent = async () => {
    if (!addStudentForm.student_name || !addStudentForm.student_email || !addStudentForm.student_phone || !addStudentForm.batch_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsGeneratingQR(true);
    const studentId = generateUniqueStudentId();
    const selectedBatch = batches.find(batch => batch.batch_id === addStudentForm.batch_id);

    const studentData = {
      ...addStudentForm,
      student_id: studentId
    };

    try {
      const qrCode = await generateQRCode(studentData, selectedBatch);
      if (qrCode) {
        setGeneratedQRCode(qrCode);
        toast.success('QR Code generated successfully!');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }

    setIsGeneratingQR(false);
  };

  const handleAddStudent = async () => {
    if (!generatedQRCode) {
      toast.error('Please generate QR code first');
      return;
    }

    const studentData = {
      ...addStudentForm,
      student_id: generatedQRCode.studentId
    };

    try {
      const response = await axios.post('http://localhost:5000/addstudent', {
        student: studentData,
        trainer_id: props.user.trainer_id
      });

      if (response.data.message === 'Student details saved successfully') {
        setStudents(prev => [...prev, studentData]);
        toast.success(`${studentData.student_name} added successfully!`);
        downloadQRCode();
        closeAddStudentModal();
        fetchStudents();
      } else {
        toast.error('Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student. Please try again.');
    }
  };

  const closeAddStudentModal = () => {
    setIsAddStudentModalOpen(false);
    setAddStudentForm({
      student_name: '',
      student_email: '',
      student_phone: '',
      batch_id: '',
      student_domain: ''
    });
    setGeneratedQRCode(null);
  };

  const downloadQRCode = () => {
    if (generatedQRCode) {
      const link = document.createElement('a');
      link.href = generatedQRCode.imageDataUrl;
      link.download = generatedQRCode.imageName;
      link.click();
    }
  };

  // Attendance calendar state for add attendance
  const [newAttendanceDate, setNewAttendanceDate] = useState('');
  const [newAttendanceStatus, setNewAttendanceStatus] = useState('Present');


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header and Add Student */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Database</h1>
            <p className="text-gray-600">Manage student records and unique identifiers</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-72"
              />
            </div>
            <button 
              onClick={() => setIsAddStudentModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {/* Table and filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Students
              {selectedAttendanceDate && (
                <span className="text-sm text-gray-500 ml-2">
                  - Attendance for {formatDate(selectedAttendanceDate)}
                </span>
              )}
            </h2>
            <div className="flex gap-3">
              <Card className="bg-white shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <select
                      value={selectedBatch?.batch_id || ''}
                      onChange={(e) => handleBatchChange(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
                    >
                      <option value="">All Batches</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.session} - {batch.domain}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </Card>
              <Card className="bg-white shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <select
                      value={selectedAttendanceDate || ''}
                      onChange={(e) => handleAttendanceDateChange(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
                    >
                      <option value="">All Dates</option>
                      {getUniqueAttendanceDates().map((date, index) => (
                        <option key={index} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Student ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Batch</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">
                    {selectedAttendanceDate ? 'Attendance Status' : 'Attendance Rate'}
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student) => {
                  const attendanceRecord = selectedAttendanceDate
                    ? markedAttendance.find(attendance =>
                        attendance.student_id === student.student_id &&
                        attendance.attandance_date === selectedAttendanceDate
                      )
                    : null;
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-900 font-medium">{student.student_id}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                            {student.student_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-900 font-medium">{student.student_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{student.student_domain}</td>
                      <td className="py-4 px-6 text-gray-600">{student.student_email}</td>
                      <td className="py-4 px-6 text-gray-600">{student.student_phone_number || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {selectedAttendanceDate ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attendanceRecord?.status === 'Present'
                              ? 'bg-green-100 text-green-800'
                              : attendanceRecord?.status === 'Absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {attendanceRecord?.status || 'No Record'}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceColor(student.calculatedAttendanceRate)}`}>
                            {student.calculatedAttendanceRate}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {currentStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No students found</p>
              {selectedAttendanceDate && (
                <p className="text-gray-400 text-sm mt-2">
                  No students have attendance records for {formatDate(selectedAttendanceDate)}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
              {selectedAttendanceDate && ` with attendance on ${formatDate(selectedAttendanceDate)}`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 border border-gray-300 rounded text-sm ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border border-gray-300 rounded text-sm ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Student Details Modal */}
        {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Student Details' : 'Student Details'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Modal Body */}
              <div className="p-6 bg-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedStudent.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.student_name}</h3>
                    <p className="text-gray-600">{selectedStudent.student_id}</p>
                  </div>
                </div>
                {/* NEW: Add Attendance Calendar & Status UI (Only visible NOT in edit mode) */}
                {!isEditMode && (
                  <div className="mb-6 flex items-center gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Add Attendance</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="date"
                          value={newAttendanceDate}
                          onChange={e => setNewAttendanceDate(e.target.value)}
                          className="border border-gray-300 px-2 py-1 rounded"
                        />
                        <select
                          value={newAttendanceStatus}
                          onChange={e => setNewAttendanceStatus(e.target.value)}
                          className="border border-gray-300 px-2 py-1 rounded"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                        </select>
                        <button
                          onClick={updateAttendance}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium"
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Pick date, select status, then add attendance for this student.</p>
                    </div>
                  </div>
                )}
                {/* New QR Code Preview Section */}
                {batchChangedQRCode && isBatchChanged && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">New QR Code Generated</h4>
                        <p className="text-xs text-blue-700 mb-3">
                          A new QR code has been generated due to batch change. It will be downloaded when you save changes.
                        </p>
                        <button
                          onClick={downloadBatchChangedQRCode}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download Now
                        </button>
                      </div>
                      <div className="flex-shrink-0">
                        <img
                          src={batchChangedQRCode.imageDataUrl}
                          alt="New QR Code Preview"
                          className="w-20 h-20 border border-blue-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Editable Student Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    {/* Editable Email */}
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        {isEditMode ? (
                          <input
                            type="email"
                            value={editingStudentDetails.student_email}
                            onChange={(e) => setEditingStudentDetails(prev => ({
                              ...prev, student_email: e.target.value
                            }))}
                            className="border border-gray-300 px-2 py-1 rounded w-full"
                          />
                        ) : (
                          <p className="text-gray-600">{selectedStudent.student_email}</p>
                        )}
                      </div>
                    </div>
                    {/* Editable Phone */}
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        {isEditMode ? (
                          <input
                            type="tel"
                            value={editingStudentDetails.student_phone_number}
                            onChange={(e) => setEditingStudentDetails(prev => ({
                              ...prev, student_phone_number: e.target.value
                            }))}
                            className="border border-gray-300 px-2 py-1 rounded w-full"
                          />
                        ) : (
                          <p className="text-gray-600">{selectedStudent.student_phone_number || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                    {/* Editable Batch */}
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900">Batch</p>
                        {isEditMode ? (
                          <div className="relative">
                            <select
                              value={editingStudentDetails.batch_id}
                              onChange={(e) => handleEditBatchChange(e.target.value)}
                              className="w-full appearance-none bg-white border border-gray-300 rounded px-2 py-1 pr-8 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {batches.map((batch) => (
                                <option key={batch.batch_id} value={batch.batch_id}>
                                  {batch.session} - {batch.domain}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        ) : (
                          <p className="text-gray-600">
                            {batches.find(b => b.batch_id === selectedStudent.batch_id)?.session || 'N/A'} - {batches.find(b => b.batch_id === selectedStudent.batch_id)?.domain || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Overall Attendance</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceColor(selectedStudent.calculatedAttendanceRate)}`}>
                            {selectedStudent.calculatedAttendanceRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Classes</p>
                        <p className="text-gray-600">
                          {getStudentAttendanceHistory(selectedStudent.student_id).length} sessions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance History */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {isEditMode ? 'Edit Attendance History' : 'Recent Attendance History'}
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {getStudentAttendanceHistory(selectedStudent.student_id).length > 0 ? (
                      getStudentAttendanceHistory(selectedStudent.student_id).map((attendance, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">{formatDate(attendance.attandance_date)}</span>
                          {isEditMode ? (
                            <select
                              value={editingAttendance[index]?.status || attendance.status}
                              onChange={(e) => handleAttendanceChange(index, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              attendance.status === 'Present'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendance.status}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No attendance records found</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white">
                {isEditMode ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setBatchChangedQRCode(null);
                        setIsBatchChanged(false);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDeleteStudent}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Delete Student
                  </button>
                )}
                {!isEditMode && (
                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleEditStudent}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Edit Student
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {isAddStudentModalOpen && (
          <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
                <button
                  onClick={closeAddStudentModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      value={addStudentForm.student_name}
                      onChange={(e) => handleAddStudentFormChange('student_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Email *
                    </label>
                    <input
                      type="email"
                      value={addStudentForm.student_email}
                      onChange={(e) => handleAddStudentFormChange('student_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter student email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={addStudentForm.student_phone}
                      onChange={(e) => handleAddStudentFormChange('student_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Batch *
                    </label>
                    <div className="relative">
                      <select
                        value={addStudentForm.batch_id}
                        onChange={(e) => handleAddStudentFormChange('batch_id', e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select a batch</option>
                        {batches.map((batch) => (
                          <option key={batch.batch_id} value={batch.batch_id}>
                            {batch.session} - {batch.domain}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  {addStudentForm.student_domain && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domain
                      </label>
                      <input
                        type="text"
                        value={addStudentForm.student_domain}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        placeholder="Domain will be auto-filled"
                      />
                    </div>
                  )}
                </form>
                {/* QR Code Generation Section */}
                {!generatedQRCode ? (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleGenerateQRForNewStudent}
                      disabled={isGeneratingQR || !addStudentForm.student_name || !addStudentForm.student_email || !addStudentForm.student_phone || !addStudentForm.batch_id}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isGeneratingQR ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generating QR Code...
                        </>
                      ) : (
                        <>
                          Generate QR Code
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Fill all required fields to generate QR code
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Generated QR Code</h4>
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <img
                          src={generatedQRCode.imageDataUrl}
                          alt={`QR Code for ${generatedQRCode.studentName}`}
                          className="mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Student ID: {generatedQRCode.studentId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center p-6 border-t border-gray-200">
                <button
                  onClick={closeAddStudentModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!generatedQRCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
