import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VCodezLogin from "../client/Pages/Login";
import MainDashboard from "../client/Pages/Maindashboard";
import Dashboard from "../client/Pages/Dashboard";
import MyBatches from "../client/Pages/Batches";
import StudentDatabase from "../client/Pages/Students";
import ReportsAnalytics from "../client/Pages/Reportandanalysis";
import QRScanner from "../client/Pages/Qr-scanner";
import VCodezSignUp from "../client/Pages/Signup";
import {doc,getDoc} from "firebase/firestore"
import {auth,db} from  "../client/Firebase"
import { useEffect, useState } from "react";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [user, setUser] = useState();

    useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() );
        }
      }
    })
  },[])
  return (<>
 
      <Router>
      <Routes>
      
      
        <Route path="/" element={user?(<MainDashboard user={user} />):(<VCodezLogin/>)} />
        <Route path="/login" element={<VCodezLogin />} />
        <Route path="/signup" element={<VCodezSignUp />} />
        <Route path="/maindashboard" element={<MainDashboard user={user} />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/mybatches" element={<MyBatches user={user} />} />
        <Route path="/students" element={<StudentDatabase user={user} />} />
        <Route path="/reports" element={<ReportsAnalytics user={user} />} />
        <Route path="/qrscanner" element={<QRScanner user={user} />} />
      </Routes>
    </Router>
    <ToastContainer 
        position="bottom-right"
        autoClose={5000}   // auto dismiss in 5 seconds
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
  </>
 
  );
}

export default App;
