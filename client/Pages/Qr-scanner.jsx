import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { 
  QrCode, 
  Camera, 
  Square, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Users, 
  ClipboardList,
  UserCheck,
  UserX,
  Plus,
  Mail,
  ChevronDown,
  Calendar,
  Clock
} from "lucide-react";
import axios from "axios";

// Simple Card Components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-white text-slate-900 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Simple Button Component
const Button = ({ children, className = "", variant = "default", disabled = false, onClick }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors px-4 py-2";
  const variants = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-slate-300 bg-white hover:bg-slate-50",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Enhanced Toast System
const toast = {
  success: (message) => {
    console.log(`✅ Success: ${message}`);
    if (Notification.permission === "granted") {
      new Notification("✅ Attendance Marked", { body: message });
    }
    showToastMessage(message, 'success');
  },
  error: (message) => {
    console.log(`❌ Error: ${message}`);
    if (Notification.permission === "granted") {
      new Notification("❌ Error", { body: message });
    }
    showToastMessage(message, 'error');
  },
  info: (message) => {
    console.log(`ℹ️ Info: ${message}`);
    if (Notification.permission === "granted") {
      new Notification("ℹ️ Info", { body: message });
    }
    showToastMessage(message, 'info');
  }
};

// Simple toast display function
const showToastMessage = (message, type) => {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toastElement = document.createElement('div');
  
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  toastElement.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg mb-2 opacity-0 transition-opacity duration-300`;
  toastElement.textContent = message;
  
  toastContainer.appendChild(toastElement);
  
  setTimeout(() => toastElement.classList.remove('opacity-0'), 100);
  setTimeout(() => {
    toastElement.classList.add('opacity-0');
    setTimeout(() => {
      if (toastContainer.contains(toastElement)) {
        toastContainer.removeChild(toastElement);
      }
    }, 300);
  }, 3000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-4 right-4 z-50';
  document.body.appendChild(container);
  return container;
};

export default function QRScanner(props) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [students, setStudents] = useState([]);
  const [scannedStudentIds, setScannedStudentIds] = useState(new Set()); // Track present students' IDs scanned already
  
  // New state variables for storing present and absent students with dates
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [scanningCompleted, setScanningCompleted] = useState(false);
  
  const scannedRawQRCodes = useRef(new Set()); // Track raw QR code strings scanned to prevent duplicates
  const scanCooldownRef = useRef(false); // Throttle scans - one every 3 seconds

  const [activeTab, setActiveTab] = useState('recent');
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  const today = new Date().toISOString().split("T")[0]; 
  console.log("Today's Date:", today);

  useEffect(() => {
    const fetchattendance = async () => {
      try{
        const response = await axios.post('http://localhost:5000/getattendance', {
          batch_id: selectedBatch ? selectedBatch.batch_id : null,
          attandance_date: today
        });
        if (response.data.attendance) {
          setMarkedAttendance(response.data.attendance);
          
          // Check if attendance is already marked for this batch today
          const attendanceExists = response.data.attendance.some(
            attendance => attendance.batch_id === selectedBatch?.batch_id
          );
          setIsAttendanceMarked(attendanceExists);
        }
      } catch(err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance data. Please refresh and try again.');
      }
    }
    fetchattendance();
  }, [selectedBatch, today]);

  console.log("Marked Attendance:", markedAttendance)
  
  useEffect(() => {
    const fetchbatches = async () => {
      try{
        const response = await axios.post('http://localhost:5000/getbatches', {
          trainer_id: props.user.trainer_id
        });
        if (response.data.batches) {
          console.log("Batches:", response.data.batches);
          setBatches(response.data.batches);
        }
      } catch(err) {
        console.error('Error fetching batches:', err);
        toast.error('Failed to load batch data. Please refresh and try again.');
      }
    }

    fetchbatches();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try{
        const response = await axios.post('http://localhost:5000/getstudents', {
          batch_id: selectedBatch ? selectedBatch.batch_id : null
        });
        if (response.data.students) {
          setStudents(response.data.students);
          
          // If attendance is already marked, load the existing attendance data
          if (isAttendanceMarked && markedAttendance.length > 0) {
            const todaysAttendance = markedAttendance.filter(
              attendance => attendance.batch_id === selectedBatch?.batch_id
            );
            
            const presentIds = new Set(
              todaysAttendance
                .filter(att => att.status === 'Present')
                .map(att => att.student_id)
            );
            
            const presentStudentsData = response.data.students
              .filter(student => presentIds.has(student.student_id))
              .map(student => ({
                ...student,
                status: "Present",
                scannedDate: today,
                scanTime: "Previously marked"
              }));
            
            const absentStudentsData = response.data.students
              .filter(student => !presentIds.has(student.student_id))
              .map(student => ({
                ...student,
                status: "Absent",
                scannedDate: today
              }));
            
            setPresentStudents(presentStudentsData);
            setAbsentStudents(absentStudentsData);
            setScannedStudentIds(presentIds);
          } else {
            // Initialize absent students with all students if no attendance marked yet
            const initialAbsent = response.data.students.map(student => ({
              ...student,
              status: "Absent",
              scannedDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
            }));
            setAbsentStudents(initialAbsent);
            setPresentStudents([]);
            setScannedStudentIds(new Set());
          }
        }
      } catch(err) {
        console.error('Error fetching students:', err);
        toast.error('Failed to load student data. Please refresh and try again.');
      }
    }
    
    if (selectedBatch) {
      fetchStudents();
    }

    // Request notification permission if needed
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [selectedBatch, isAttendanceMarked, markedAttendance]);

  const handleBatchChange = (batchId) => {
    const batch = batches.find(b => b.batch_id === batchId);
    setSelectedBatch(batch);
    
    if (batch) {
      // Reset attendance states for the new batch
      setScannedStudentIds(new Set());
      setPresentStudents([]);
      setAbsentStudents([]);
      setRecentScans([]);
      setIsAttendanceMarked(false);
      scannedRawQRCodes.current = new Set();
      setScanningCompleted(false);
      
      toast.info(`Selected batch: ${batch.session} - ${batch.domain}`);
    }
  };

  // Filter students based on selected batch
  const filteredStudents = selectedBatch 
    ? students.filter(student => student.batch_id === selectedBatch.batch_id)
    : students;

  const startScanning = async () => {
    if (!selectedBatch) {
      toast.error("Please select a batch before starting the scanner.");
      return;
    }

    if (isAttendanceMarked) {
      toast.error("Attendance has already been marked for this batch today.");
      return;
    }

    try {
      setIsScanning(true);
      setScannedData(null);
      setScanningCompleted(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Your browser doesn't support camera access.");
        setIsScanning(false);
        return;
      }

      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        toast.error("No camera found on this device.");
        setIsScanning(false);
        return;
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const data = typeof result === 'string' ? result : result.data;
          if (!scanCooldownRef.current && !scannedRawQRCodes.current.has(data)) {
            handleScanResult(data);
            scannedRawQRCodes.current.add(data);
            scanCooldownRef.current = true;
            setTimeout(() => {
              scanCooldownRef.current = false;
            }, 3000);
          } else if (scannedRawQRCodes.current.has(data)) {
            toast.info("This QR code was already scanned recently.");
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
      setHasPermission(true);
      toast.info("Camera ready! Point at a student QR code to mark attendance.");

    } catch (error) {
      console.error("Scanner error:", error);
      setIsScanning(false);

      if (error.name === 'NotAllowedError') {
        setHasPermission(false);
        toast.error("Camera access denied. Please allow camera access and refresh the page.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera device found on this device.");
      } else {
        toast.error("Failed to start camera scanner. Please refresh and try again.");
      }
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setScanningCompleted(true);
  };

  const handleScanResult = (data) => {
    setScannedData(data);

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      parsedData = { type: "text", data };
    }

    let scanRecord = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toDateString()
    };

    // Handle Student QR with student_id and batch_id
    if (parsedData.student_id && parsedData.batch_id) {
      const student = filteredStudents.find(s =>
        s.student_id === parsedData.student_id &&
        s.batch_id === parsedData.batch_id
      );
      if (student) {
        if (scannedStudentIds.has(student.student_id)) {
          scanRecord = {
            ...scanRecord,
            studentName: student.student_name,
            studentId: student.student_id,
            studentEmail: student.student_email,
            studentDomain: student.student_domain,
            batchId: student.batch_id,
            type: "Student QR",
            status: "Already Scanned"
          };
          toast.info(`ℹ️ ${student.student_name} (${student.student_id}) already marked present today!`);
        } else {
          setScannedStudentIds(prev => new Set(prev).add(student.student_id));
          
          // Add to present students
          const presentStudent = {
            ...student,
            status: "Present",
            scannedDate: new Date().toISOString().split('T')[0],
            scanTime: new Date().toLocaleTimeString()
          };
          setPresentStudents(prev => [...prev, presentStudent]);
          
          // Remove from absent students
          setAbsentStudents(prev => prev.filter(s => s.student_id !== student.student_id));
          
          scanRecord = {
            ...scanRecord,
            studentName: student.student_name,
            studentId: student.student_id,
            studentEmail: student.student_email,
            studentDomain: student.student_domain,
            batchId: student.batch_id,
            type: "Student QR",
            status: "Present"
          };
          toast.success(`🎉 ${student.student_name} (${student.student_id}) is marked PRESENT!`);
        }
      } else {
        scanRecord = {
          ...scanRecord,
          studentName: "Student Not Found",
          studentId: parsedData.student_id,
          batchId: parsedData.batch_id,
          type: "Invalid QR",
          status: "Not Found"
        };
        toast.error(`❌ Student '${parsedData.student_name}' (${parsedData.student_id}) not found in batch '${parsedData.batch_id}'!`);
      }
    }
    // Plain text QR or unknown QR handling
    else if (parsedData.type === "text") {
      const student = filteredStudents.find(s => s.student_id === parsedData.data);
      if (student) {
        if (scannedStudentIds.has(student.student_id)) {
          scanRecord = {
            ...scanRecord,
            studentName: student.student_name,
            studentId: student.student_id,
            studentEmail: student.student_email,
            studentDomain: student.student_domain,
            batchId: student.batch_id,
            type: "Student QR",
            status: "Already Scanned"
          };
          toast.info(`ℹ️ ${student.student_name} already marked present today!`);
        } else {
          setScannedStudentIds(prev => new Set(prev).add(student.student_id));
          
          // Add to present students
          const presentStudent = {
            ...student,
            status: "Present",
            scannedDate: new Date().toISOString().split('T')[0],
            scanTime: new Date().toLocaleTimeString()
          };
          setPresentStudents(prev => [...prev, presentStudent]);
          
          // Remove from absent students
          setAbsentStudents(prev => prev.filter(s => s.student_id !== student.student_id));
          
          scanRecord = {
            ...scanRecord,
            studentName: student.student_name,
            studentId: student.student_id,
            studentEmail: student.student_email,
            studentDomain: student.student_domain,
            batchId: student.batch_id,
            type: "Student QR",
            status: "Present"
          };

          toast.success(`🎉 ${student.student_name} is marked PRESENT!`);
        }
      } else {
        scanRecord = {
          ...scanRecord,
          studentName: "Unknown QR Code",
          studentId: parsedData.data.substring(0, 20) + (parsedData.data.length > 20 ? "..." : ""),
          type: "Other",
          status: "Unknown"
        };
        toast.error(`Unknown QR code detected. Not a valid student QR.`);
      }
    } else {
      scanRecord = {
        ...scanRecord,
        studentName: "Unknown QR Code",
        studentId: data.substring(0, 20) + (data.length > 20 ? "..." : ""),
        type: "Other",
        status: "Unknown"
      };
      toast.error(`Unknown QR code format. Please use a valid student QR code.`);
    }

    // Update recent scans list (scrollable UI)
    setRecentScans(prev => [scanRecord, ...prev]);

    // Clear scannedData message after 3 seconds
    setTimeout(() => setScannedData(null), 3000);
  };

  // Handle Add Attendance button click
  const handleAddAttendance = async () => {
    try{
      const response = await axios.post('http://localhost:5000/addattendance', {
        presentStudents,
        absentStudents,
        trainer_id: props.user.trainer_id
      })
      if(response.data.message){
        toast.success(response.data.message);
        setIsAttendanceMarked(true); // Mark attendance as completed
      }
      else{
        toast.error("Failed to add attendance. Please try again.");
      }
    }
    catch(err){
      console.error('Error adding attendance:', err);
      toast.error("Error adding attendance. Please try again.");
    }
  };

  // Handle Send Email button click
  const handleSendEmail = () => {
    toast.success("Email sent successfully!");
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, []);

  console.log("Present Students:", presentStudents)
  console.log("Absent Students:", absentStudents)

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <main className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Batch Selection Dropdown */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Select Batch</h3>
                  <p className="text-sm text-slate-600">Choose a batch to mark attendance for</p>
                </div>
                <div className="relative">
                  <select
                    value={selectedBatch?.batch_id || ''}
                    onChange={(e) => handleBatchChange(e.target.value)}
                    className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
                  >
                    <option value="">Select a batch...</option>
                    {batches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.session} - {batch.domain}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {selectedBatch && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Selected: {selectedBatch.session} - {selectedBatch.domain}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {filteredStudents.length} students in this batch
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Already Marked Alert */}
          {selectedBatch && isAttendanceMarked && (
            <Card className="bg-green-50 border border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Attendance Already Marked Today
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      The attendance for <strong>{selectedBatch.session} - {selectedBatch.domain}</strong> has already been marked for today ({new Date().toLocaleDateString()}).
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-green-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Date: {new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Status: Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">QR Code Scanner</h2>
            <p className="text-slate-600 mt-1">Scan student QR codes to mark attendance</p>
            <p className="text-sm text-slate-500 mt-2">
              {selectedBatch 
                ? `${filteredStudents.length} students loaded for ${selectedBatch.session} - ${selectedBatch.domain}` 
                : 'Please select a batch to begin'
              }
            </p>
          </div>

          {/* Scanner Section */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6">
              {!isScanning ? (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="text-blue-600 w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Scan QR Codes</h3>
                    <p className="text-slate-600">
                      {isAttendanceMarked 
                        ? "Attendance has already been marked for this batch today" 
                        : "Click start to open your camera and begin marking attendance"
                      }
                    </p>
                  </div>
                  
                  {hasPermission === false && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="text-red-600 w-5 h-5" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-red-800">Camera Access Denied</p>
                          <p className="text-sm text-red-700">Please allow camera access and refresh the page.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={startScanning}
                    className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 font-medium"
                    disabled={hasPermission === false || !selectedBatch || filteredStudents.length === 0 || isAttendanceMarked}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {!selectedBatch ? 'Select a Batch First' : 
                     isAttendanceMarked ? 'Attendance Already Marked' :
                     filteredStudents.length === 0 ? 'Loading Students...' : 
                     'Start Camera Scanner'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Live QR Scanner</h3>
                    <Button onClick={stopScanning} variant="outline">
                      <Square className="w-4 h-4 mr-2" />
                      Stop Scanner
                    </Button>
                  </div>
                  
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video ref={videoRef} className="w-full h-80 object-cover" playsInline />
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-70"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Scanning for student QR codes...
                    </div>
                  </div>
                  
                  {scannedData && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="text-green-600 w-5 h-5 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-green-800">QR Code Detected!</p>
                          <p className="text-sm text-green-700 mt-1 font-mono break-all">
                            {scannedData.length > 100 ? `${scannedData.substring(0, 100)}...` : scannedData}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6">
              {/* Tab Headers */}
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'recent'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Recent Scans ({recentScans.length})
                </button>
                <button
                  onClick={() => setActiveTab('present')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'present'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Present ({presentStudents.length})
                </button>
                <button
                  onClick={() => setActiveTab('absent')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'absent'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Absent ({absentStudents.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'recent' && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Scans</h3>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {recentScans.length > 0 ? (
                      recentScans.map((scan) => (
                        <div key={scan.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              scan.status === 'Present' ? 'bg-emerald-500' : 
                              scan.status === 'Already Scanned' ? 'bg-blue-500' :
                              scan.type === 'Batch QR' ? 'bg-blue-500' :
                              scan.status === 'Unknown' || scan.status === 'Not Found' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                              {scan.type === 'Student QR' ? (
                                <User className="text-white w-4 h-4" />
                              ) : scan.type === 'Batch QR' ? (
                                <Users className="text-white w-4 h-4" />
                              ) : (
                                <QrCode className="text-white w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 truncate">{scan.studentName}</p>
                              <div className="text-sm text-slate-600">
                                <span>{scan.studentId}</span>
                                {scan.studentEmail && <span> • {scan.studentEmail}</span>}
                                {scan.studentDomain && <span> • {scan.studentDomain}</span>}
                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                                  scan.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 
                                  scan.status === 'Already Scanned' ? 'bg-blue-100 text-blue-700' :
                                  scan.status === 'Unknown' || scan.status === 'Not Found' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {scan.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{scan.timestamp}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4" />
                        <p>No scans yet</p>
                        <p className="text-sm mt-2">Scanned QR codes will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'present' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Present Students Today</h3>
                    {scanningCompleted && presentStudents.length > 0 && !isAttendanceMarked && (
                      <Button onClick={handleAddAttendance} variant="success" className="ml-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Attendance
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {presentStudents.length > 0 ? (
                      presentStudents.map((student) => (
                        <div key={student.student_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500">
                              <UserCheck className="text-white w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{student.student_name}</p>
                              <div className="text-sm text-slate-600">
                                <span>{student.student_id}</span>
                                {student.student_email && <span> • {student.student_email}</span>}
                                {student.student_domain && <span> • {student.student_domain}</span>}
                                <span> • Batch: {student.batch_id}</span>
                                <span> • Date: {student.scannedDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-emerald-600">Present</span>
                            <p className="text-sm text-slate-500">{student.scanTime}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <UserCheck className="w-16 h-16 mx-auto mb-4" />
                        <p>No students marked present yet</p>
                        <p className="text-sm mt-2">Students marked present today will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'absent' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Absent Students Today</h3>
                    {absentStudents.length > 0 && (
                      <Button onClick={handleSendEmail} variant="danger" className="ml-4">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {absentStudents.length > 0 ? (
                      absentStudents.map((student) => (
                        <div key={student.student_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500">
                              <UserX className="text-white w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{student.student_name}</p>
                              <div className="text-sm text-slate-600">
                                <span>{student.student_id}</span>
                                {student.student_email && <span> • {student.student_email}</span>}
                                {student.student_domain && <span> • {student.student_domain}</span>}
                                <span> • Batch: {student.batch_id}</span>
                                <span> • Date: {student.scannedDate}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-red-600">Absent</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <UserX className="w-16 h-16 mx-auto mb-4" />
                        <p>All students are present!</p>
                        <p className="text-sm mt-2">Students not marked present will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}