import React, { useState } from 'react';
import { Mail, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {auth,db} from '../Firebase'
import { signInWithEmailAndPassword } from 'firebase/auth';
import{ doc, getDoc } from 'firebase/firestore';




export default function VCodezLogin() {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if(loginData.email === '' || loginData.password === ''){
            toast.warn('Please fill in all fields.');
            setIsLoading(false);
            return;
        }
        else{
          try{
await signInWithEmailAndPassword(auth,loginData.email,loginData.password);
const user=auth.currentUser;
if(user){
   
            console.log('Login attempt:', loginData);
            setIsLoading(false);
          
                toast.success("Logged in successfully!");
                navigate("/maindashboard"); 
      
           
       
}

        }
        catch(error){
            setIsLoading(false);
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential' ) {
                toast.error('Invalid email or password. Please try again.');
            } else if (error.code === 'auth/user-disabled') {
                toast.error('This account has been disabled. Please contact support.');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Too many unsuccessful login attempts. Please try again later.');
            } else {
                toast.error('An unexpected error occurred. Please try again later.');
            }

        }

        }
        

     
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Column - Hero Section */}
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
                            Welcome to <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">VCodez</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8">
                            Professional Student Attendance Management System
                        </p>
                        
                        {/* Feature Previews */}
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

                {/* Right Column - Login Form */}
                <div className="w-full relative top-8">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200">
                        {/* Mobile Header */}
                        <div className="text-center space-y-4 lg:hidden p-6 border-b border-slate-200">
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
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign In</h2>
                                <p className="text-slate-600">Access your VCodez dashboard</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                            <Mail className="w-4 h-4" />
                                            <span>Email Address</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="john.doe@vcodez.com"
                                            value={loginData.email}
                                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                                            <Lock className="w-4 h-4" />
                                            <span>Password</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="password123"
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                                required
                                                className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                  

                            
                                    
                                    <button
                                        onClick={handleLogin}
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                    >
                                        {isLoading ? "Signing In..." : (
                                            <div className="flex items-center justify-center space-x-2">
                                                <span>Sign In to Dashboard</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Link to Sign Up */}
                                    <div className="text-center pt-4 border-t border-slate-200">
                                        <p className="text-sm text-slate-600">
                                            Don't have an account?{' '}
                                            <button 
                                                onClick={() => navigate('/signup')}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Create Account
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}