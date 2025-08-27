import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Dashboard from './Dashboard';
import MyBatches from './Batches';
import StudentDatabase from './Students';
import ReportsAnalytics from './Reportandanalysis';
import QRScanner from './Qr-scanner';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Firebase';
import axios from 'axios';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview and quick stats' },
  { id: 'batches', label: 'My Batches', description: 'Manage student groups' },
  { id: 'scanner', label: 'QR Scanner', description: 'Scan attendance codes' },
  { id: 'students', label: 'Student Database', description: 'View and manage students' },
  { id: 'reports', label: 'Report & Export', description: 'Analytics and data export' }
];

export default function MainDashboard(props) {
  const [trainerData, setTrainerData] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (props.user) setTrainerData(props.user);
  }, [props.user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const handleProfileView = () => {
    console.log('Opening profile...');
    setShowProfileDropdown(false);
  };

  const renderFeatureIcon = (featureId, isActive) => {
    const iconColor = isActive ? 'text-white' : 'text-slate-600';
    const iconSize = 'w-6 h-6';

    switch (featureId) {
      case 'dashboard':
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'batches':
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'scanner':
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
          </svg>
        );
      case 'students':
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'reports':
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconSize} ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
    }
  };

  const renderActiveSection = () => {
    const sectionProps = {
      className: `transition-all duration-300 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`
    };

    const sectionContent = {
      dashboard: <Dashboard user={trainerData}/>,
      batches: <MyBatches user={trainerData} />,
      scanner: <QRScanner user={trainerData} />,
      students: <StudentDatabase user={trainerData} />,
      reports: <ReportsAnalytics user={trainerData} />
    };

    return <div {...sectionProps}>{sectionContent[activeSection] || sectionContent.dashboard}</div>;
  };

  const handleSectionChange = (section) => {
    if (section === activeSection) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setIsTransitioning(false);
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = event.target.closest('[data-profile-dropdown]');
      if (!profileDropdown && showProfileDropdown) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // Show loading until trainerData is available
  if (!trainerData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-gray-600 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 relative z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">&lt;</span>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">&gt;</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-800 text-lg">VCodez Attendance</span>
                <span className="text-sm text-gray-500">Student Management System</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>

              <div className="relative" data-profile-dropdown>
                <div
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {trainerData.trainer_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{trainerData.trainer_name}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{trainerData.trainer_name}</p>
                      <p className="text-xs text-gray-500">{trainerData.trainer_email}</p>
                    </div>
                    <button
                      onClick={handleProfileView}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {navigationItems.map((item, index) => (
              <div
                key={item.id}
                className="group cursor-pointer transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleSectionChange(item.id)}
              >
                <div
                  className={`relative overflow-hidden rounded-xl p-6 border-2 transition-all duration-300 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-br from-blue-500 to-green-500 border-blue-400 text-white shadow-xl shadow-blue-500/25'
                      : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white/80 hover:border-blue-300 hover:shadow-lg'
                  }`}
                >
                  <div className="relative z-10 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${activeSection === item.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                      {renderFeatureIcon(item.id, activeSection === item.id)}
                    </div>
                    <h3 className={`font-semibold mb-1 ${activeSection === item.id ? 'text-white' : 'text-slate-800'}`}>
                      {item.label}
                    </h3>
                    <p className={`text-xs ${activeSection === item.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {activeSection === item.id && <div className="absolute top-2 right-2"><div className="w-3 h-3 bg-white rounded-full"></div></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Section Content */}
        <div className="relative z-20">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-3xl blur-xl opacity-60"></div>
          <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-1">{renderActiveSection()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
