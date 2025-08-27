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

  // Generate unique IDs
  const generateUniqueStudentId = () => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `VCS${randomNum}`;
  };

  const generateUniqueBatchID = () => {
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(7, '0');
    return `VCB${randomNum}`;
  };

  const generateUniqueIds = (studentsCount) => {
    const ids = new Set();
    const uniqueIds = [];
    while (uniqueIds.length < studentsCount) {
      const newId = generateUniqueStudentId();
      if (!ids.has(newId)) {
        ids.add(newId);
        uniqueIds.push(newId);
      }
    }
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
      // Fallback QR generation code can go here if needed (same as your original)
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

        setExcelData(jsonData);
        setStoredJsonData(jsonData);
        setCurrentPage(1);
        setLoading(false);

      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generate QR codes for all students
  const generateAllQRCodes = async () => {
    if (!excelData.length || !batchName || !domainName || !timings) {
      return;
    }
    setProcessing(true);
    setQrCodes([]);

    const newBatchId = generateUniqueBatchID();
    setBatchUniqueId(newBatchId);

    const batchInfo = {
      batchId: newBatchId,
      batchName,
      domain: domainName,
      timings
    };

    const uniqueIds = generateUniqueIds(excelData.length);
    const qrResults = [];

    for (let i = 0; i < excelData.length; i++) {
      const qr = await generateQRCode(excelData[i], i, batchInfo, uniqueIds[i]);
      if (qr) qrResults.push(qr);
      if (i < excelData.length - 1) await new Promise(res => setTimeout(res, 100));
    }

    setQrCodes(qrResults);
    setProcessing(false);
  };

  // Create batch and download ZIP of QR codes
  const createBatchWithStudents = async () => {
    if (!batchName || !domainName || !timings || !excelData.length || !qrCodes.length) {
      return;
    }

    const enhancedExcelData = excelData.map((student, index) => ({
      ...student,
      studentId: qrCodes[index].studentId
    }));

    const newBatch = {
      id: batchUniqueId,
      title: batchName,
      description: `${domainName} course`,
      status: "Active",
      students: enhancedExcelData,
      schedule: timings,
      domain: domainName,
      createdAt: new Date().toISOString()
    };

    setBatches([newBatch, ...batches]);

    try {
      const response = await axios.post('http://localhost:5000/createbatch', {
        user_data: props.user,
        newBatch,
      });

      const zip = new JSZip();
      for (let i = 0; i < qrCodes.length; i++) {
        const qr = qrCodes[i];
        const resp = await fetch(qr.imageDataUrl);
        const blob = await resp.blob();
        zip.file(qr.imageName, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${batchName.replace(/\s+/g, '_')}_QR_Codes.zip`);

      // Optionally show success message
      // toast.success('Batch created and ZIP downloaded successfully!');

    } catch (error) {
      console.error('Error creating batch:', error);
      // Optionally show error message
      // toast.error('Failed to create batch. Please try again.');
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

            {/* Action Buttons */}
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
                  disabled={!qrCodes.length}
                  className={`bg-blue-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    !qrCodes.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  <Download size={16} />
                  Create Batch & Download ZIP
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
