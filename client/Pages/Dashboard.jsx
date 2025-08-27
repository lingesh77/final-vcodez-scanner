import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect } from 'react';
import axios from 'axios';
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

export default function Dashboard(props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('Software Engineering');
    const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Domain options array
  const domains = [
    {
      name: 'Software Engineering',
      description: 'Web Dev, Mobile Apps, Backend'
    },
    {
      name: 'Data Science',
      description: 'ML, Analytics, AI'
    },
    {
      name: 'DevOps Engineering',
      description: 'Cloud, CI/CD, Infrastructure'
    },
    {
      name: 'Cybersecurity',
      description: 'Security, Penetration Testing'
    },
    {
      name: 'UI/UX Design',
      description: 'Design Systems, User Research'
    },
    {
      name: 'Quality Assurance',
      description: 'Testing, Automation, QA'
    }
  ];
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
  // Mock data to match your original code
  const stats = {
    totalStudents: 6,
    presentToday: 0,
    activeBatches: 2,
    attendanceRate: 0
  };

/*   const batches = [
    { id: 1, name: "Web Development Bootcamp", isActive: true },
    { id: 2, name: "Mobile App Development", isActive: true }
  ]; */

  const trendData = [
    { date: '01/15', attendanceRate: 60 },
    { date: '01/16', attendanceRate: 95 },
    { date: '01/17', attendanceRate: 98 },
    { date: '01/18', attendanceRate: 88 },
    { date: '01/19', attendanceRate: 92 },
    { date: '01/20', attendanceRate: 90 },
    { date: '01/21', attendanceRate: 96 }
  ];
console.log(batches);
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
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <main className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Dashboard Overview
              </h2>
              <p className="text-slate-600 mt-1">Welcome back, monitor your classes and attendance</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
              
                
                   {/* Batch Selection Dropdown */}
            <CardContent className="p-6">
              <div className="flex items-center justify-between  mt-5">
               
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
              </div>
              
             
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Students</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.totalStudents}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-emerald-600 text-sm">↗ 12%</span>
                  <span className="text-slate-500 text-sm">vs last month</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Present Today</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.presentToday}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-emerald-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-emerald-600 text-sm">{stats.attendanceRate}%</span>
                  <span className="text-slate-500 text-sm">attendance rate</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Batches</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {stats.activeBatches}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-slate-600 text-sm">All sessions</span>
                  <span className="text-emerald-600 text-sm">running</span>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Weekly Average</p>
                    <p className="text-2xl font-bold text-slate-800">
                      87%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 bg-orange-200 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-emerald-600 text-sm">↗ 3%</span>
                  <span className="text-slate-500 text-sm">improvement</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Chart & Batch Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Attendance Trend (7 Days)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
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
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                <div className="space-y-4">
                  {batches.length > 0 ? (
                    batches.slice(0, 2).map((batch) => (
                      <div key={batch.batch_id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-800">{batch.session}-{batch.domain }</h4>
                          <span className={`px-2 py-1 text-xs rounded-lg ${
                            batch.status=='Active'
 
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
                
                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium bg-transparent border-none cursor-pointer">
                  View All Batches →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}