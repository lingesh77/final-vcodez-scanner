import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Users, Calendar, QrCode, Download, FileSpreadsheet, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';
import QRCodeLib from 'qrcode';
import { useNavigate,Link } from 'react-router-dom';

export default function BatchQRApp(props) {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [domainName, setDomainName] = useState('');
  const [timings, setTimings] = useState('');
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [storedJsonData, setStoredJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [batchUniqueId, setBatchUniqueId] = useState(''); // Store batch ID once generated

  // Dropdown options
  const batchNameOptions = [
    'Web Development Bootcamp',
    'Mobile App Development',
    'Data Science Fundamentals',
    'Machine Learning Intensive',
    'Full Stack JavaScript',
    'Python Programming',
    'React Native Development',
    'DevOps and Cloud Computing',
    'Cybersecurity Essentials',
    'UI/UX Design Workshop'
  ];

  const domainOptions = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
    'Software Engineering',
    'Database Management',
    'Network Administration'
  ];

  const timingOptions = [
    'Mon-Fri 9AM-5PM',
    'Mon-Fri 10AM-6PM',
    'Tue-Thu 2PM-6PM',
    'Mon-Wed-Fri 9AM-1PM',
    'Tue-Thu 6PM-10PM',
    'Sat-Sun 10AM-4PM',
    'Saturday 9AM-5PM',
    'Sunday 10AM-6PM',
    'Mon-Fri 6PM-9PM',
    'Weekend Intensive 9AM-9PM'
  ];

  // Pagination states
  const studentsPerPage = 4;
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = excelData.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(excelData.length / studentsPerPage);

  const goToPage = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getbatches', {
          trainer_id: props.user.trainer_id
        });
        if (response.data.batches) {
          setBatches(response.data.batches);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
      }
    };
    fetchBatches();
  }, [props.user.trainer_id]);

  // Generate unique IDs - Enhanced with better collision prevention
  const generateUniqueStudentId = (existingIds = new Set()) => {
    let attempts = 0;
    let newId;
    
    do {
      const timestamp = Date.now().toString().slice(-4);
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      newId = `VCS${timestamp}${randomNum}`.slice(0, 10); // Ensure consistent length
      attempts++;
      
      // Prevent infinite loop
      if (attempts > 100) {
        newId = `VCS${Date.now()}${Math.random().toString(36).substr(2, 5)}`.slice(0, 10);
        break;
      }
    } while (existingIds.has(newId));
    
    return newId;
  };

  const generateUniqueBatchID = () => {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VCB${timestamp}${randomNum}`.slice(0, 15);
  };

  // Enhanced function to generate unique IDs with better collision handling
  const generateUniqueIds = (studentsCount) => {
    const ids = new Set();
    const uniqueIds = [];
    
    console.log(`Starting ID generation for ${studentsCount} students`);
    
    // Keep generating until we have exactly the required number of unique IDs
    for (let i = 0; i < studentsCount; i++) {
      const newId = generateUniqueStudentId(ids);
      ids.add(newId);
      uniqueIds.push(newId);
    }
    
    console.log(`Successfully generated ${uniqueIds.length} unique IDs for ${studentsCount} students`);
    console.log('Sample IDs:', uniqueIds.slice(0, 3));
    
    return uniqueIds;
  };

  // Generate QR Code for each student
  const generateQRCode = async (studentData, index, batchInfo, uniqueId) => {
    const studentName = studentData.student_name || studentData.name || `Student ${index + 1}`;
    const qrData = {
      student_id: uniqueId,
      student_name: studentName,
      batch_id: batchInfo.batchId,
      batch_name: batchInfo.batchName,
      domain: batchInfo.domain,
      timings: batchInfo.timings,
    };
    const qrText = JSON.stringify(qrData);

    const completeData = {
      studentId: uniqueId,
      ...studentData,
      batchInfo: {
        batchName: batchInfo.batchName,
        domain: batchInfo.domain,
        timings: batchInfo.timings,
        createdAt: new Date().toISOString()
      }
    };

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
          ctx.fillText(`ID: ${uniqueId}`, qrSize / 2, qrSize + 20);

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(studentName, qrSize / 2, qrSize + 45);

          const finalDataUrl = canvas.toDataURL('image/png');

          resolve({
            id: index + 1,
            studentId: uniqueId,
            studentName,
            data: completeData,
            qrText,
            imageDataUrl: finalDataUrl,
            imageName: `${uniqueId}_${studentName.replace(/\s+/g, '_')}_QR.png`
          });
        };
        img.src = qrDataURL;
      });

    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseExcelFile(uploadedFile);
    }
  };

  const parseExcelFile = (file) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Raw Excel data loaded: ${jsonData.length} rows`);
        
        // Filter out empty rows and clean data
        const cleanedData = jsonData.filter(student => {
          const studentName = student.student_name || student.name || student.Name;
          return studentName && String(studentName).trim() !== '';
        });

        // Remove any potential duplicates from Excel data itself
        const uniqueStudents = cleanedData.filter((student, index, self) => {
          const studentName = (student.student_name || student.name || student.Name || '').toString().trim().toLowerCase();
          const email = (student.email || student.Email || '').toString().trim().toLowerCase();
          
          // Check for duplicates based on name or email
          return index === self.findIndex(s => {
            const sName = (s.student_name || s.name || s.Name || '').toString().trim().toLowerCase();
            const sEmail = (s.email || s.Email || '').toString().trim().toLowerCase();
            
            // Consider duplicate if same name OR same email (if email exists)
            return sName === studentName || (email && sEmail && sEmail === email);
          });
        });

        console.log(`After cleaning: ${cleanedData.length} valid rows`);
        console.log(`After removing duplicates: ${uniqueStudents.length} unique students`);

        if (uniqueStudents.length === 0) {
          alert('No valid student data found in the Excel file. Please check the format.');
          setLoading(false);
          return;
        }

        setExcelData(uniqueStudents);
        setStoredJsonData(uniqueStudents);
        setCurrentPage(1);
        setLoading(false);

      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error reading Excel file. Please ensure it\'s a valid .xlsx or .xls file.');
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generate QR codes for all students - Enhanced with progress tracking
  const generateAllQRCodes = async () => {
    if (!excelData.length || !batchName || !domainName || !timings) {
      alert('Please fill in all fields and upload student data before generating QR codes.');
      return;
    }
    
    console.log(`=== Starting QR Code Generation ===`);
    console.log(`Students to process: ${excelData.length}`);
    
    setProcessing(true);
    setQrCodes([]); // Clear any existing QR codes

    const newBatchId = generateUniqueBatchID();
    setBatchUniqueId(newBatchId);

    const batchInfo = {
      batchId: newBatchId,
      batchName,
      domain: domainName,
      timings
    };

    // Generate exactly the same number of unique IDs as students
    const uniqueIds = generateUniqueIds(excelData.length);
    const qrResults = [];

    console.log(`Generated unique IDs:`, uniqueIds);

    // Process each student exactly once with progress tracking
    for (let i = 0; i < excelData.length; i++) {
      try {
        console.log(`Processing student ${i + 1}/${excelData.length}: ${excelData[i].student_name || excelData[i].name || 'Unknown'}`);
        
        const qr = await generateQRCode(excelData[i], i, batchInfo, uniqueIds[i]);
        if (qr) {
          qrResults.push(qr);
          console.log(`✓ QR code generated for student ${i + 1} (ID: ${uniqueIds[i]})`);
        } else {
          console.error(`✗ Failed to generate QR code for student ${i + 1}`);
        }
        
        // Small delay to prevent overwhelming the browser
        if (i < excelData.length - 1) {
          await new Promise(res => setTimeout(res, 50));
        }
      } catch (error) {
        console.error(`Error generating QR code for student ${i + 1}:`, error);
      }
    }

    console.log(`=== QR Code Generation Complete ===`);
    console.log(`Expected: ${excelData.length} QR codes`);
    console.log(`Generated: ${qrResults.length} QR codes`);
    console.log(`Success rate: ${((qrResults.length / excelData.length) * 100).toFixed(1)}%`);

    if (qrResults.length !== excelData.length) {
      alert(`Warning: Expected ${excelData.length} QR codes but only generated ${qrResults.length}. Some QR codes may have failed to generate.`);
    }

    setQrCodes(qrResults);
    setProcessing(false);
  };

  // Create batch and download ZIP of QR codes - Fixed to ensure exact student count
  const createBatchWithStudents = async () => {
    if (!batchName || !domainName || !timings || !excelData.length || !qrCodes.length) {
      console.log('Missing required data for batch creation');
      return;
    }

    // Ensure we have the same number of students and QR codes
    if (excelData.length !== qrCodes.length) {
      console.error(`Mismatch: ${excelData.length} students but ${qrCodes.length} QR codes`);
      return;
    }

    // Map each student with their corresponding QR code data
    const enhancedExcelData = excelData.map((student, index) => ({
      ...student,
      studentId: qrCodes[index].studentId,
      qrGenerated: true,
      createdAt: new Date().toISOString()
    }));

    const newBatch = {
      id: batchUniqueId,
      title: batchName,
      description: `${domainName} course`,
      status: "Active",
      students: enhancedExcelData, // This will have exactly the same count as Excel
      schedule: timings,
      domain: domainName,
      createdAt: new Date().toISOString(),
      studentCount: enhancedExcelData.length // Explicit count for verification
    };

    console.log(`Creating batch with ${newBatch.students.length} students`);

    // Update local state first
    setBatches([newBatch, ...batches]);

    try {
      // Send to backend
      const response = await axios.post('http://localhost:5000/createbatch', {
        user_data: props.user,
        newBatch,
      });

      console.log('Batch created successfully:', response.data);

      // Generate ZIP file with QR codes
      const zip = new JSZip();
      for (let i = 0; i < qrCodes.length; i++) {
        const qr = qrCodes[i];
        try {
          const resp = await fetch(qr.imageDataUrl);
          const blob = await resp.blob();
          zip.file(qr.imageName, blob);
        } catch (error) {
          console.error(`Error adding QR code ${i} to zip:`, error);
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${batchName.replace(/\s+/g, '_')}_QR_Codes.zip`);

      console.log(`ZIP file created with ${qrCodes.length} QR codes`);

    } catch (error) {
      console.error('Error creating batch:', error);
      // Remove from local state if backend creation failed
      setBatches(batches);
    }

    // Reset form and state
    setBatchName('');
    setDomainName('');
    setTimings('');
    setExcelData([]);
    setStoredJsonData(null);
    setQrCodes([]);
    setFile(null);
    setCurrentPage(1);
    setShowCreateForm(false);
    setBatchUniqueId('');
  };

  const getTodaysAttendance = (students) => {
    const total = students.length;
    const present = Math.floor(total * 0.67);
    return total > 0 ? `${present}/${total} (${Math.round((present / total) * 100)}%)` : '0/0 (0%)';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Batches</h1>
            <p className="text-gray-600">Manage your student groups and attendance sessions</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <BookOpen size={16} />
            {showCreateForm ? 'Cancel' : 'Create New Batch'}
          </button>
        </div>

        {/* Create Batch Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Batch</h2>
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen size={16} className="inline mr-1" />
                  Batch Name
                </label>
                <select
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a batch name</option>
                  {batchNameOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <QrCode size={16} className="inline mr-1" />
                  Domain Name
                </label>
                <select
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a domain</option>
                  {domainOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Timings
              </label>
              <select
                value={timings}
                onChange={(e) => setTimings(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select timing schedule</option>
                {timingOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileSpreadsheet size={16} className="inline mr-1" />
                Upload Student Data (Excel)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <FileSpreadsheet size={32} className="text-blue-500 mx-auto mb-2" />
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium inline-block">
                    Choose Excel File
                  </div>
                  <p className="text-gray-500 text-sm mt-2">Upload .xlsx or .xls files only</p>
                </label>
                {file && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-green-700 font-medium">{file.name}</p>
                    <p className="text-green-600 text-sm">File uploaded and converted to JSON ✓</p>
                  </div>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Converting Excel to JSON...</p>
              </div>
            )}

            {/* Data Preview with Pagination */}
            {excelData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Student Data ({excelData.length} students)
                  </h3>
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, excelData.length)} of {excelData.length} students
                  </div>
                </div>
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">S.No</th>
                        {Object.keys(excelData[0] || {}).map((key) => (
                          <th key={key} className="text-left py-3 px-4 font-semibold text-gray-700">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.map((row, i) => (
                        <tr key={indexOfFirstStudent + i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600 font-medium">{indexOfFirstStudent + i + 1}</td>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="py-3 px-4 text-gray-600">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} • Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, excelData.length)} of {excelData.length}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Processing Status */}
            {processing && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Generating QR Codes...</h3>
                  <p className="text-blue-600">
                    Processing {excelData.length} students. This may take a few moments.
                  </p>
                  <div className="mt-4 bg-white rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${(qrCodes.length / excelData.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-500 mt-2">
                    {qrCodes.length} / {excelData.length} completed
                  </p>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {excelData.length > 0 && qrCodes.length > 0 && qrCodes.length !== excelData.length && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      QR Code Count Mismatch
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Expected {excelData.length} QR codes but generated {qrCodes.length}. 
                      Some QR codes may have failed to generate. Please try regenerating.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={generateAllQRCodes}
                disabled={processing || !excelData.length || !batchName || !domainName || !timings}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  processing || !excelData.length || !batchName || !domainName || !timings ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <QrCode size={16} />
                {processing ? "Generating QR Codes..." : "Generate QR Codes"}
              </button>

              {qrCodes.length > 0 && (
                <button
                  onClick={createBatchWithStudents}
                  disabled={!qrCodes.length || qrCodes.length !== excelData.length}
                  className={`bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    !qrCodes.length || qrCodes.length !== excelData.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  <Download size={16} />
                  Create Batch & Download ZIP ({qrCodes.length}/{excelData.length})
                </button>
              )}
            </div>

            {/* QR Codes Preview */}
            {qrCodes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 mt-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Generated QR Codes Preview ({qrCodes.length} total)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {qrCodes.slice(0, 12).map(qr => (
                    <div key={qr.id} className="text-center bg-gray-50 p-3 rounded-lg border">
                      <img 
                        src={qr.imageDataUrl} 
                        alt={`QR for ${qr.studentName}`} 
                        className="w-full h-auto rounded bg-white shadow-sm mb-2" 
                      />
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qr.imageDataUrl;
                          link.download = qr.imageName;
                          link.click();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
                {qrCodes.length > 12 && (
                  <p className="text-sm text-gray-500 mt-4 text-center bg-gray-50 py-2 rounded">
                    Showing first 12 QR codes of {qrCodes.length} total. All QR codes will be included in the ZIP download.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Existing Batches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">{batch.domain}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  batch.status === 'Active' ? 
                    'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {batch.status}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{batch.session}</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm flex items-center gap-1">
                    <Users size={14} />
                    Total Students:
                  </span>
                  <span className="font-semibold text-gray-900">{batch.students.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm flex items-center gap-1">
                    <Calendar size={14} />
                    Schedule:
                  </span>
                  <span className="font-semibold text-gray-900">{batch.batch_schedule}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 text-gray-600 hover:text-gray-800 py-2 px-3 text-sm font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                onClick={() => navigate('/students')}
                >
                  <Users size={14} />
                  View Students
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}