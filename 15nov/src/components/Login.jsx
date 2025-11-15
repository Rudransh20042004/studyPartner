import { useState } from 'react';
import { checkUserExists, findSessionByStudentId } from '../utils/storage';

const Login = ({ onLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');

  // Check if user exists when student ID changes
  const handleStudentIdChange = async (value) => {
    setStudentId(value);
    setUserExists(false);
    setExistingUserName('');
    
    if (value.trim().length > 0) {
      try {
        const userCheck = await checkUserExists(value.trim());
        if (userCheck.exists) {
          setUserExists(true);
          setExistingUserName(userCheck.name);
        }
      } catch (e) {
        console.error('Error checking user:', e);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      alert('Please enter your student ID');
      return;
    }
    
    if (studentId.trim().length !== 9) {
      alert('Student ID must be exactly 9 digits');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already exists
      const userCheck = await checkUserExists(studentId.trim());
      
      if (userCheck.exists) {
        // User exists - get their name from registry or session
        const userName = userCheck.name;
        
        // Store user info in personal storage
        if (window.storage) {
          await window.storage.set('user_name', userName, false);
          await window.storage.set('user_student_id', studentId.trim(), false);
          console.log('✅ Existing user logged in:', userName, studentId.trim());
        }
        
        // Check if they have an active session
        const activeSession = await findSessionByStudentId(studentId.trim());
        if (activeSession) {
          // Restore their session
          await window.storage.set('my_session_id', activeSession.id, false);
          console.log('✅ Restored active session');
        }
        
        onLogin({ name: userName, studentId: studentId.trim(), hasActiveSession: !!activeSession });
      } else {
        // New user - store student ID only, name will be collected on landing page
        if (window.storage) {
          await window.storage.set('user_student_id', studentId.trim(), false);
          console.log('✅ New user - Student ID saved:', studentId.trim());
        }
        
        onLogin({ name: null, studentId: studentId.trim(), isNewUser: true });
      }
    } catch (e) {
      console.error('Error during login:', e);
      alert('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Study Session Matchmaker
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with McGill students studying your courses
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => {
                // Only allow digits and limit to 9 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                handleStudentIdChange(value);
              }}
              placeholder="Enter your 9-digit student ID"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
              required
              autoFocus
              maxLength={9}
              pattern="[0-9]{9}"
            />
            {studentId.length > 0 && studentId.length !== 9 && (
              <p className="mt-1 text-sm text-red-600">
                Student ID must be exactly 9 digits
              </p>
            )}
            {userExists && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Welcome back, {existingUserName}!</span>
                </p>
              </div>
            )}
            {!userExists && studentId.trim().length > 0 && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">New user detected.</span> You'll be asked for your name next.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {!window.storage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">
              ⚠️ Storage API not available. This app requires browser storage support.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;

