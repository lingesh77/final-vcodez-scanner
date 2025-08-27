import React, { useState, useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ExportImport(props) {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [markedAttendance, setMarkedAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('Excel (.xlsx)');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const formats = ['Excel (.xlsx)'];

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await axios.post('http://localhost:5000/getbatches', {
          trainer_id: props.user.trainer_id,
        });
        if (res.data.batches) setBatches(res.data.batches);
      } catch {
        toast.error('Failed to load batches.');
      }
    };
    fetchBatches();
  }, [props.user.trainer_id]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.post('http://localhost:5000/getstudents', {
          batch_id: selectedBatch ? selectedBatch.batch_id : null,
          trainer_id: props.user.trainer_id,
        });
        if (res.data.students) setStudents(res.data.students);
      } catch {
        toast.error('Failed to load students.');
      }
    };
    fetchStudents();
  }, [selectedBatch, props.user.trainer_id]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.post('http://localhost:5000/getattendance', {
          batch_id: selectedBatch ? selectedBatch.batch_id : null,
        });
        if (res.data.attendance) setMarkedAttendance(res.data.attendance);
      } catch {
        toast.error('Failed to load attendance.');
      }
    };
    fetchAttendance();
  }, [selectedBatch]);

  const handleBatchChange = (batchId) => {
    const batch = batches.find((b) => b.batch_id === batchId);
    setSelectedBatch(batch || null);
  };

  const getUniqueDates = () => {
    const dates = new Set(
      markedAttendance.map((a) =>
        new Date(a.attandance_date).toLocaleDateString()
      )
    );
    return Array.from(dates).sort((a, b) => new Date(a) - new Date(b));
  };

  const prepareExportData = () => {
    const uniqueDates = getUniqueDates();
    const studentMap = {};

    students.forEach((s) => {
      studentMap[s.student_id] = {
        student_id: s.student_id,
        student_name: s.student_name || 'Unknown',
        student_email: s.student_email || '',
        student_phone: s.student_phone_number || '',
        domain: s.student_domain || '',
        session:
          batches.find(
            (b) =>
              b.batch_id === (selectedBatch ? selectedBatch.batch_id : null)
          )?.session || '',
      };
    });

    markedAttendance.forEach((a) => {
      const sid = a.student_id;
      if (!studentMap[sid]) return;
      if (!studentMap[sid].attendance) studentMap[sid].attendance = {};
      const dateStr = new Date(a.attandance_date).toLocaleDateString();
      studentMap[sid].attendance[dateStr] = a.status;
    });

    return Object.values(studentMap).map((student) => {
      const row = { ...student };
      uniqueDates.forEach((date) => {
        row[date] = student.attendance?.[date] || '';
      });
      return row;
    });
  };

  const exportToExcel = async (data) => {
    const uniqueDates = getUniqueDates();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    const columns = [
      { header: 'Student ID', key: 'student_id', width: 15 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Email', key: 'student_email', width: 30 },
      { header: 'Phone Number', key: 'student_phone', width: 18 },
      { header: 'Domain', key: 'domain', width: 20 },
      { header: 'Session', key: 'session', width: 20 },
      ...uniqueDates.map((date) => ({ header: date, key: date, width: 15 })),
    ];
    worksheet.columns = columns;

    data.forEach((row) => {
      const rowData = {};
      columns.forEach((col) => {
        rowData[col.key] = row[col.key] || '';
      });
      const newRow = worksheet.addRow(rowData);

      uniqueDates.forEach((date) => {
        const colIndex = columns.findIndex((c) => c.key === date) + 1;
        const cell = newRow.getCell(colIndex);
        if (cell.value === 'Present') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' },
          };
          cell.font = { color: { argb: 'FF006100' } };
        } else if (cell.value === 'Absent') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' },
          };
          cell.font = { color: { argb: 'FF9C0006' } };
        }
      });
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(
      blob,
      `attendance_report_${
        selectedBatch
          ? selectedBatch.session.replace(/\s+/g, '_')
          : 'All_Batches'
      }.xlsx`
    );
  };

  const exportToCSV = (data) => {
    // CSV export functionality removed as per requirement
    console.log('CSV export not available');
  };

  const exportToPDF = (data) => {
    // PDF export functionality removed as per requirement
    console.log('PDF export not available');
  };

  const handleExport = () => {
    const data = prepareExportData();
    if (data.length === 0) {
      toast.warning('No data available');
      return;
    }

    try {
      exportToExcel(data);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      toast.error(`Failed to export Excel file: ${error.message}`);
      console.error('Export error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Export and Analysis
          </h1>
          <p className="text-gray-600">
            Export attendance reports with session info, domain, and colored status in Excel format
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-6 shadow border border-gray-200 mb-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Select Batch
              </label>
              <select
                value={selectedBatch?.batch_id || ''}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.session} - {batch.domain}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Export Format
              </label>
              <div className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-50 text-gray-700">
                Excel (.xlsx)
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
                disabled={markedAttendance.length === 0 || students.length === 0}
              >
                <Download className="w-5 h-5" />
                Export Data
              </button>
            </div>
          </div>

          {/* Format Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Excel Format:</strong> Full formatting with colored attendance cells, borders, and proper column widths.
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        {selectedBatch && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Attendance Details - {selectedBatch.session}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50">
                      Student ID
                    </th>
                    <th className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50">
                      Name
                    </th>
                    <th className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50">
                      Email
                    </th>
                    <th className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50">
                      Phone
                    </th>
                    <th className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50">
                      Domain
                    </th>
                    {getUniqueDates().map((date) => (
                      <th
                        key={date}
                        className="border border-gray-300 px-3 py-2 sticky top-0 bg-gray-50"
                      >
                        {date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prepareExportData().map((student) => (
                    <tr key={student.student_id}>
                      <td className="border border-gray-300 px-3 py-2">
                        {student.student_id}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {student.student_name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {student.student_email}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {student.student_phone}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {student.domain}
                      </td>
                      {getUniqueDates().map((date) => {
                        const status = student[date];
                        return (
                          <td
                            key={date}
                            className={`border border-gray-300 px-3 py-2 font-semibold ${
                              status === 'Present'
                                ? 'bg-green-100 text-green-800'
                                : status === 'Absent'
                                ? 'bg-red-100 text-red-800'
                                : ''
                            }`}
                          >
                            {status || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {prepareExportData().length === 0 && (
                <p className="p-4 text-center text-gray-600">
                  No attendance data to display.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}