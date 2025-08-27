import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { 
  QrCode, Camera, Square, CheckCircle, AlertTriangle, User, Users, ClipboardList,
  UserCheck, UserX, Plus, Mail, ChevronDown, Calendar, Clock
} from "lucide-react";
import { toast } from 'react-toastify';

// Helper to format date (e.g. '08/25')
function formatDate(dateString) {
  const d = new Date(dateString);
  return `${('0' + (d.getMonth() + 1)).slice(-2)}/${('0' + d.getDate()).slice(-2)}`;
}

export default function Dashboard(props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [batches, setBatches] = useState([]);
  const [Noofbatchesactive, setNoofbatchesactive] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalattadancetoday, settotalattadancetoday] = useState(null);
  const [showingAllBatches, setShowingAllBatches] = useState(true);
  const [overallAttendanceRate, setOverallAttendanceRate] = useState(0);
  const [entireattdancedata, setentireattdancedata] = useState([]);

  // Fetch all attendance data for the trainer
  useEffect(() => {
    const fetchattendance = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getattendance', {
          trainer_id: props.user.trainer_id,
        });
        setentireattdancedata(response.data.attendance);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance data. Please try again.');
      }
    };
    fetchattendance();
  }, [props.user.trainer_id]);

  // Fetch batch info
  useEffect(() => {
    const fetchbatches = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getbatches', {
          trainer_id: props.user.trainer_id,
        });
        if (response.data.batches) {
          setBatches(response.data.batches);
          const activeCount = response.data.batches.filter(batch => batch.status === 'Active').length;
          setNoofbatchesactive(activeCount);
          const totalStudentsCount = response.data.batches.reduce(
            (total, batch) => total + (batch.students ? batch.students.length : 0),
            0
          );
          setTotalStudents(totalStudentsCount);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        toast.error('Failed to load batch data. Please refresh and try again.');
      }
    };
    fetchbatches();
  }, []);

  const today = new Date().toISOString().split("T")[0]; 

  // Fetch attendance for today for all batches
  useEffect(() => {
    const fetchattendance = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getattadancefordashboard', {
          attandance_date: today,
          trainer_id: props.user.trainer_id,
        });
        if (response.data.attendance) {
          setMarkedAttendance(response.data.attendance);
          const studentpresenttoday = response.data.attendance.filter(attendance => attendance.status === 'Present').length;
          settotalattadancetoday(studentpresenttoday);
          setShowingAllBatches(true);

          const activeBatches = batches.filter(batch => batch.status === 'Active');
          const totalActiveStudents = activeBatches.reduce(
            (total, batch) => total + (batch.students ? batch.students.length : 0),
            0
          );
          const attendanceRate = totalActiveStudents > 0 ? Math.round((studentpresenttoday / totalActiveStudents) * 100) : 0;
          setOverallAttendanceRate(attendanceRate);
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        toast.error('Failed to load attendance data. Please refresh and try again.');
      }
    }
    fetchattendance();
  }, [props.user.trainer_id, batches]); // Added batches as dependency

  // Fetch attendance for a specific batch when selected
  useEffect(() => {
    if (!selectedBatch) return;
    const fetchattendance = async () => {
      try {
        const response = await axios.post('http://localhost:5000/getattendance', {
          batch_id: selectedBatch.batch_id,
          attandance_date: today,
        });
        if (response.data.attendance) {
          setMarkedAttendance(response.data.attendance);
          const studentpresenttoday = response.data.attendance.filter(attendance => attendance.status === 'Present').length;
          settotalattadancetoday(studentpresenttoday);
          setShowingAllBatches(false);

          const totalStudentsInBatch = selectedBatch.students ? selectedBatch.students.length : 0;
          const batchAttendanceRate = totalStudentsInBatch > 0 ? Math.round((studentpresenttoday / totalStudentsInBatch) * 100) : 0;
          setOverallAttendanceRate(batchAttendanceRate);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast.error('Failed to load attendance data. Please refresh and try again.');
      }
    }
    fetchattendance();
  }, [selectedBatch, today]);

  // Handle batch selection logic
  const handleBatchChange = async (batchId) => {
    if (!batchId) {
      // Show all batches
      const studentsCount = batches.reduce(
        (total, batch) => total + (batch.students ? batch.students.length : 0),
        0
      );
      setSelectedBatch(null);
      setTotalStudents(studentsCount);
      setShowingAllBatches(true);
      try {
        const response = await axios.post('http://localhost:5000/getattadancefordashboard', {
          attandance_date: today,
          trainer_id: props.user.trainer_id,
        });
        if (response.data.attendance) {
          setMarkedAttendance(response.data.attendance);
          const studentpresenttoday = response.data.attendance.filter(attendance => attendance.status === 'Present').length;
          settotalattadancetoday(studentpresenttoday);
          const activeBatches = batches.filter(batch => batch.status === 'Active');
          const totalActiveStudents = activeBatches.reduce(
            (total, batch) => total + (batch.students ? batch.students.length : 0),
            0
          );
          const attendanceRate = totalActiveStudents > 0 ? Math.round((studentpresenttoday / totalActiveStudents) * 100) : 0;
          setOverallAttendanceRate(attendanceRate);
        }
      } catch (err) {
        console.error('Error fetching all attendance:', err);
        // Fallback
        const activeBatches = batches.filter(batch => batch.status === 'Active');
        const totalActiveStudents = activeBatches.reduce(
          (total, batch) => total + (batch.students ? batch.students.length : 0),
          0
        );
        const studentpresenttoday = markedAttendance.filter(attendance => attendance.status === 'Present').length;
        const attendanceRate = totalActiveStudents > 0 ? Math.round((studentpresenttoday / totalActiveStudents) * 100) : 0;
        settotalattadancetoday(studentpresenttoday);
        setOverallAttendanceRate(attendanceRate);
      }
      toast.info('Showing data for all batches');
      return;
    }

    const batch = batches.find(b => b.batch_id === batchId);
    if (batch) {
      setSelectedBatch(batch);
      setShowingAllBatches(false);
      const studentsInBatch = batch.students ? batch.students.length : 0;
      setTotalStudents(studentsInBatch);
      toast.info(`Selected batch: ${batch.session} - ${batch.domain}`);
    }
  }

  // --- Attendance Trend Chart Calculation ---
  // Get all dates in order (last 7 dates max)
  const uniqueDates = Array.from(
    new Set(
      entireattdancedata
        .map(rec => rec.attandance_date)
        .sort((a, b) => new Date(a) - new Date(b))
    )
  ).slice(-7);

  // Attendance rate for each day (all batches or selected batch)
  const attendanceTrend = uniqueDates.map(date => {
    let dayRecords;
    let totalStudentsForDay = 0;
    if (selectedBatch) {
      // Only this batch
      dayRecords = entireattdancedata.filter(
        rec => rec.attandance_date === date && rec.batch_id === selectedBatch.batch_id
      );
      totalStudentsForDay = selectedBatch.students ? selectedBatch.students.length : 0;
    } else {
      // All batches
      dayRecords = entireattdancedata.filter(rec => rec.attandance_date === date);
      // Sum of all active batch students
      const activeBatches = batches.filter(batch => batch.status === 'Active');
      totalStudentsForDay = activeBatches.reduce(
        (total, batch) => total + (batch.students ? batch.students.length : 0),
        0
      );
    }
    const presentCount = dayRecords.filter(rec => rec.status === 'Present').length;
    const attendanceRate = totalStudentsForDay > 0 ? Math.round((presentCount / totalStudentsForDay) * 100) : 0;
    return {
      date: formatDate(date),
      attendanceRate,
      present: presentCount,
      total: totalStudentsForDay,
    };
  });

  // --- UI Components ---
  const Card = ({ children, className = "" }) => (
    <div className={`rounded-lg border bg-white text-slate-900 shadow-sm ${className}`}>
      {children}
    </div>
  );
  const CardContent = ({ children, className = "" }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <main className="max-w-7xl mx-auto">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
              <p className="text-slate-600 mt-1">
                Welcome back, monitor your classes and attendance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mt-5">
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
                        Showing data for this batch only
                      </p>
                    </div>
                  )}
                  {!selectedBatch && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Showing data for all batches
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Select a batch above to view specific batch data
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between ">
                  <div>
                    <p className="text-slate-600 text-sm">
                     Total Students:
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {totalStudents}
                    </p>
                      <p className="text-slate-600 text-sm">
                      {showingAllBatches ? 'All Batches' : `Students in ${selectedBatch?.session}`}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">
                      {showingAllBatches ? 'Present Today (All Batches) :' : `Present in ${selectedBatch?.session}:`}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {totalattadancetoday || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-emerald-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-emerald-600 text-sm">{overallAttendanceRate}%</span>
                  <span className="text-slate-500 text-sm">attendance rate</span>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">No of Batches:</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {Noofbatchesactive}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-200 rounded"></div>
                  </div>
                </div>
             
              </div>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">
                      {showingAllBatches ? 'Overall Attendance Rate:' : `${selectedBatch?.session} Attendance Rate:`}
                    </p>
                    <p className="text-2xl font-bold text-slate-800">
                      {overallAttendanceRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-orange-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-emerald-600 text-sm">
                    {showingAllBatches ? 'All batches combined' : 'Current batch only'}
                  </span>
                  <span className="text-slate-500 text-sm">today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Chart & Batch Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Attendance Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#64748b"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendanceRate" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Attendance Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Batch Overview</h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {batches.length > 0 ? (
                    batches.map((batch) => (
                      <div key={batch.batch_id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800">{batch.session}-{batch.domain}</h4>
                          <span className={`px-2 py-1 text-xs rounded-lg ${
                            batch.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Students enrolled</span>
                          <span className="text-emerald-600 font-medium">{batch.students.length}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-4"></div>
                      <p>No batches created yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
