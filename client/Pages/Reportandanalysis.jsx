import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { ChevronDown, Download } from 'lucide-react';

export default function ReportsAnalytics() {
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [selectedFormat, setSelectedFormat] = useState('Excel (.xlsx)');
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const batches = ['All Batches', 'Web Development Bootcamp', 'Mobile App Development', 'Data Science Fundamentals'];
  const formats = ['Excel (.xlsx)', 'CSV (.csv)', 'PDF (.pdf)'];

  const weeklyData = [
    { day: 'Mon', Present: 5, Absent: 1, total: 6 },
    { day: 'Tue', Present: 4, Absent: 2, total: 6 },
    { day: 'Wed', Present: 6, Absent: 0, total: 6 },
    { day: 'Thu', Present: 3, Absent: 3, total: 6 },
    { day: 'Fri', Present: 5, Absent: 1, total: 6 }
  ];

  const trendData = [
    { date: '01/16', rate: 85, present: 5, total: 6 },
    { date: '01/17', rate: 88, present: 5, total: 6 },
    { date: '01/18', rate: 92, present: 6, total: 6 },
    { date: '01/19', rate: 87, present: 5, total: 6 },
    { date: '01/20', rate: 90, present: 5, total: 6 },
    { date: '01/21', rate: 89, present: 5, total: 6 },
    { date: '01/22', rate: 94, present: 6, total: 6 }
  ];

  const performanceData = [
    { name: 'Excellent (90%+)', value: 2, color: '#10B981', percentage: '33%', students: 2 },
    { name: 'Good (75-89%)', value: 3, color: '#3B82F6', percentage: '50%', students: 3 },
    { name: 'Average (60-74%)', value: 1, color: '#F59E0B', percentage: '17%', students: 1 },
    { name: 'Poor (<60%)', value: 0, color: '#EF4444', percentage: '0%', students: 0 }
  ];

  const getExportData = () => {
    const baseData = [
      { studentName: 'John Doe', batch: 'Web Development Bootcamp', totalClasses: 30, attended: 28, attendanceRate: '93.3%', lastAttended: '2025-01-22' },
      { studentName: 'Jane Smith', batch: 'Web Development Bootcamp', totalClasses: 30, attended: 25, attendanceRate: '83.3%', lastAttended: '2025-01-21' },
      { studentName: 'Mike Johnson', batch: 'Mobile App Development', totalClasses: 25, attended: 23, attendanceRate: '92.0%', lastAttended: '2025-01-22' },
      { studentName: 'Sarah Wilson', batch: 'Mobile App Development', totalClasses: 25, attended: 20, attendanceRate: '80.0%', lastAttended: '2025-01-20' },
      { studentName: 'Alex Brown', batch: 'Data Science Fundamentals', totalClasses: 35, attended: 32, attendanceRate: '91.4%', lastAttended: '2025-01-22' },
      { studentName: 'Emma Davis', batch: 'Web Development Bootcamp', totalClasses: 30, attended: 22, attendanceRate: '73.3%', lastAttended: '2025-01-19' }
    ];

    if (selectedBatch === 'All Batches') {
      return baseData;
    }
    return baseData.filter(student => student.batch === selectedBatch);
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data) => {
    const headers = ['Student Name', 'Batch', 'Total Classes', 'Attended', 'Attendance Rate', 'Last Attended'];
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        [
          `"${row.studentName}"`,
          `"${row.batch}"`,
          row.totalClasses,
          row.attended,
          row.attendanceRate,
          row.lastAttended
        ].join(',')
      )
    ];
    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `attendance_report_${selectedBatch.replace(/\s+/g, '_')}_${timestamp}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
  };

  const exportToExcel = (data) => {
    const headers = ['Student Name', 'Batch', 'Total Classes', 'Attended', 'Attendance Rate', 'Last Attended'];
    const excelContent = `
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.studentName}</td>
              <td>${row.batch}</td>
              <td>${row.totalClasses}</td>
              <td>${row.attended}</td>
              <td>${row.attendanceRate}</td>
              <td>${row.lastAttended}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `attendance_report_${selectedBatch.replace(/\s+/g, '_')}_${timestamp}.xls`;
    downloadFile(excelContent, filename, 'application/vnd.ms-excel');
  };

  const exportToPDF = (data) => {
    const timestamp = new Date().toISOString().split('T');
    const avgAttendance = (data.reduce((sum, student) => sum + parseFloat(student.attendanceRate), 0) / data.length).toFixed(1);
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Attendance Report - ${selectedBatch}</h1>
        <div class="summary">
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Students:</strong> ${data.length}</p>
          <p><strong>Average Attendance:</strong> ${avgAttendance}%</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Batch</th>
              <th>Total Classes</th>
              <th>Attended</th>
              <th>Attendance Rate</th>
              <th>Last Attended</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.studentName}</td>
                <td>${row.batch}</td>
                <td>${row.totalClasses}</td>
                <td>${row.attended}</td>
                <td>${row.attendanceRate}</td>
                <td>${row.lastAttended}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const filename = `attendance_report_${selectedBatch.replace(/\s+/g, '_')}_${timestamp}.html`;
    downloadFile(pdfContent, filename, 'text/html');
  };

  const handleExport = () => {
    const exportData = getExportData();

    if (exportData.length === 0) {
      alert('No data available for the selected batch.');
      return;
    }

    switch (selectedFormat) {
      case 'CSV (.csv)':
        exportToCSV(exportData);
        break;
      case 'Excel (.xlsx)':
        exportToExcel(exportData);
        break;
      case 'PDF (.pdf)':
        exportToPDF(exportData);
        break;
      default:
        console.log('Unknown format selected');
    }
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const attendanceRate = Math.round((data.Present / data.total) * 100);

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`${label}day`}</p>
          <p className="text-green-600">{`Present: ${data.Present} students`}</p>
          <p className="text-red-600">{`Absent: ${data.Absent} students`}</p>
          <p className="text-gray-700 border-t pt-2 mt-2">{`Attendance Rate: ${attendanceRate}%`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Date: ${label}`}</p>
          <p className="text-blue-600">{`Attendance Rate: ${data.rate}%`}</p>
          <p className="text-gray-700">{`Present: ${data.present}/${data.total} students`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-700">{`Students: ${data.students}`}</p>
          <p className="text-gray-700">{`Percentage: ${data.percentage}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Generate detailed attendance reports and analytics</p>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Attendance Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Select Batch Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
              <div className="relative">
                <button
                  onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                  className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">{selectedBatch}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isBatchDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {batches.map((batch) => (
                      <button
                        key={batch}
                        onClick={() => {
                          setSelectedBatch(batch);
                          setIsBatchDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {batch}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Format Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="relative">
                <button
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-700">{selectedFormat}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isFormatDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {formats.map((format) => (
                      <button
                        key={format}
                        onClick={() => {
                          setSelectedFormat(format);
                          setIsFormatDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>

        {/* Stats Cards with hover effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Overall Attendance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <div className="w-10 h-10 bg-blue-200 rounded-full group-hover:bg-blue-300 transition-colors"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Attendance</h3>
            <div className="text-3xl font-bold text-blue-600 mb-1">87%</div>
            <p className="text-sm text-gray-600">Average across all batches</p>
            <div className="mt-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Total Classes: 35 | Present: 183 | Absent: 27
            </div>
          </div>

          {/* Active Students */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <div className="w-10 h-10 bg-green-200 rounded-full group-hover:bg-green-300 transition-colors"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Active Students</h3>
            <div className="text-3xl font-bold text-green-600 mb-1">6</div>
            <p className="text-sm text-gray-600">Currently enrolled</p>
            <div className="mt-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Web Dev: 3 | Mobile: 2 | Data Science: 1
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <div className="w-10 h-10 bg-purple-200 rounded-full group-hover:bg-purple-300 transition-colors"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">This Week</h3>
            <div className="text-3xl font-bold text-purple-600 mb-1">92%</div>
            <p className="text-sm text-gray-600">Weekly attendance rate</p>
            <div className="mt-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Present: 23/25 | Trend: ↗ +5%
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Attendance Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="Present" fill="#10B981" name="Present" />
                  <Bar dataKey="Absent" fill="#EF4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Absent</span>
              </div>
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend (Last 7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">→ Attendance Rate (%)</span>
            </div>
          </div>
        </div>

        {/* Student Performance Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Performance Distribution</h3>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <div className="w-80 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-4">
              {performanceData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">{`${item.percentage} (${item.students} students)`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
