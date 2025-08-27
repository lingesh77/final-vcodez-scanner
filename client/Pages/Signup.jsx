import React, { useState } from 'react';
import { Mail, User, Lock, Building, ArrowRight, CheckCircle, ChevronDown, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, db } from '../Firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

export default function VCodezSignUp() {
    const navigate = useNavigate();
    const [registerData, setRegisterData] = useState({ 
        email: '', 
        password: '', 
        name: '', 
        domains: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const availableDomains = [
        'Computer Science', 'Information Technology', 'Software Engineering', 'Data Science',
        'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Web Development',
        'Mobile Development', 'Cloud Computing', 'DevOps', 'Database Management',
        'Network Administration', 'UI/UX Design', 'Digital Marketing', 'Project Management',
        'Business Analysis', 'Quality Assurance', 'Game Development', 'Blockchain Technology'
    ];

    const addDomain = (domain) => {
        if (!registerData.domains.includes(domain)) {
            setRegisterData({
                ...registerData,
                domains: [...registerData.domains, domain]
            });
        }
        setIsDropdownOpen(false);
    };

    const removeDomain = (domainToRemove) => {
        setRegisterData({
            ...registerData,
            domains: registerData.domains.filter(domain => domain !== domainToRemove)
        });
    };

    const checkTrainerIdExists = async (trainer_id) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("trainer_id", "==", trainer_id));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const generateTrainerId = async () => {
        const generateRandomId = () => {
            const randomNum = Math.floor(Math.random() * 1000); // 0 to 999
            return `VCT${String(randomNum).padStart(3, "0")}`;
        };

        let trainer_id = generateRandomId();
        let exists = await checkTrainerIdExists(trainer_id);

        // Keep generating until unique
        while (exists) {
            trainer_id = generateRandomId();
            exists = await checkTrainerIdExists(trainer_id);
        }

        return trainer_id;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!registerData.email || !registerData.password || !registerData.name || registerData.domains.length === 0) {
            toast.warn('Please fill in all required fields and select at least one domain');
            return;
        }
        
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
            const user = auth.currentUser;

            const trainer_id = await generateTrainerId();

            await setDoc(doc(db, "users", user.uid), {
                trainer_id: trainer_id,
                trainer_name: registerData.name,
                trainer_email: registerData.email,
                trainer_domains: registerData.domains,
            });

            const response = await axios.post('http://localhost:5000/trainerdetails', {    trainer_id: trainer_id,
                trainer_name: registerData.name,
                trainer_email: registerData.email,
                trainer_domains: registerData.domains,});
            console.log('User Details Response:', response.data);

            setTimeout(() => {
                setIsLoading(false);
                setRegistrationSuccess(true);
                toast.success('Registration successful! Please verify your email.');
            }, 1000);
            
        } catch(error) {
            setIsLoading(false);
            console.error("Registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email address is already registered');
            } else if (error.code === 'auth/weak-password') {
                toast.error('Password should be at least 6 characters');
            } else if (error.code === 'auth/invalid-email') {
                toast.error('Please enter a valid email address');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        }
    };

    if (registrationSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Registration Successful!</h2>
                        <p className="text-slate-600 mb-6">
                            We've sent a verification email to <strong>{registerData.email}</strong>. 
                            Please check your inbox and click the verification link to complete your registration.
                        </p>
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-blue-800">Next Steps:</p>
                                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                                        <li>• Check your email inbox</li>
                                        <li>• Click the verification link</li>
                                        <li>• Return here to login</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl transition-all duration-300 mb-3"
                        >
                            Go to Login
                        </button>
                        <button
                            onClick={() => {
                                setRegistrationSuccess(false);
                                setRegisterData({ email: '', password: '', name: '', domains: [] });
                            }}
                            className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 transition-all duration-300"
                        >
                            Register Another Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Column */}
                <div className="hidden lg:block space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">&lt;</span>
                            </div>
                            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">&gt;</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 text-lg">VCODEZ</span>
                                <span className="text-xs text-gray-500">TECHNOLOGY</span>
                            </div>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
                            Join <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">VCodez</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8">
                            Create your account and start managing attendance efficiently
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="w-full h-20 flex items-center justify-center mb-2 bg-blue-50 rounded-lg">
                                    <div className="text-2xl">📊</div>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">Smart Dashboard</h3>
                                <p className="text-xs text-slate-600">Real-time analytics & insights</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="w-full h-20 flex items-center justify-center mb-2 bg-green-50 rounded-lg">
                                    <div className="text-2xl">👥</div>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">Batch Management</h3>
                                <p className="text-xs text-slate-600">Organize student groups</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="w-full h-20 flex items-center justify-center mb-2 bg-purple-50 rounded-lg">
                                    <div className="text-2xl">📱</div>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">QR Code Scanner</h3>
                                <p className="text-xs text-slate-600">Fast attendance marking</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="w-full h-20 flex items-center justify-center mb-2 bg-orange-50 rounded-lg">
                                    <div className="text-2xl">📋</div>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-800">Excel Reports</h3>
                                <p className="text-xs text-slate-600">Detailed attendance data</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Registration Form */}
                <div className="w-full relative top-8">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200">
                        <div className="text-center lg:hidden p-6 border-b border-slate-200">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">&lt;</span>
                                </div>
                                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">&gt;</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">VCODEZ</span>
                                    <span className="text-xs text-gray-500">TECHNOLOGY</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">VCodez Portal</h1>
                                <p className="text-slate-600 mt-2">Student Attendance Management</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Account</h2>
                                <p className="text-slate-600">Join VCodez and streamline attendance management</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                            <User className="w-4 h-4" />
                                            <span>Full Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                            <Building className="w-4 h-4" />
                                            <span>Domains</span>
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all flex items-center justify-between bg-white"
                                            >
                                                <span className="text-slate-500">
                                                    {registerData.domains.length > 0 
                                                        ? `${registerData.domains.length} domain(s) selected`
                                                        : "Select domains"
                                                    }
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            
                                            {isDropdownOpen && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {availableDomains
                                                        .filter(domain => !registerData.domains.includes(domain))
                                                        .map((domain, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => addDomain(domain)}
                                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors border-b border-slate-100 last:border-b-0"
                                                            >
                                                                {domain}
                                                            </button>
                                                        ))
                                                    }
                                                    {availableDomains.filter(domain => !registerData.domains.includes(domain)).length === 0 && (
                                                        <div className="px-4 py-3 text-slate-500 text-sm">
                                                            All domains selected
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="min-h-[60px]">
                                    {registerData.domains.length > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 mb-1">Selected Domains:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {registerData.domains.map((domain, idx) => (
                                                    <div key={idx} className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                                        <span>{domain}</span>
                                                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeDomain(domain)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                        <Mail className="w-4 h-4" />
                                        <span>Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="example@mail.com"
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                        <Lock className="w-4 h-4" />
                                        <span>Password</span>
                                    </label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="********"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10"
                                    />
                                    <div className="absolute right-3 top-13 transform -translate-y-1/2 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="w-5 h-5 text-slate-400"/> : <Eye className="w-5 h-5 text-slate-400"/>}
                                    </div>
                                </div>

                                <button
                                    onClick={handleRegister}
                                    disabled={isLoading}
                                    className={`w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium py-3 rounded-xl transition-all duration-300 ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:from-blue-700 hover:to-cyan-700'}`}
                                >
                                    {isLoading ? 'Registering...' : 'Sign Up'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
