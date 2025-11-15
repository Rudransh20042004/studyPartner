import { useState, useEffect } from 'react';
import { getAllSessions } from '../utils/storage';
import { mcgillCourses } from '../data/courses';

const Landing = ({ onStartStudying, user }) => {
  const [name, setName] = useState(user?.name || '');
  const [courseCode, setCourseCode] = useState('');
  const [workingOn, setWorkingOn] = useState('');
  const [location, setLocation] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    // Update live count every 5 seconds
    const updateCount = async () => {
      try {
        if (window.storage) {
          const sessions = await getAllSessions();
          setLiveCount(sessions.length);
        }
      } catch (e) {
        console.error('Error updating live count:', e);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!courseCode.trim()) {
      alert('Please enter a course code');
      return;
    }

    if (!user || !user.studentId) {
      alert('Please login first');
      return;
    }

    setIsLoading(true);
    try {
      if (!window.storage) {
        alert('Storage API not available. Please check your browser support.');
        setIsLoading(false);
        return;
      }

      // Save user name if it's a new user
      if (!user.name) {
        await window.storage.set('user_name', name.trim(), false);
        console.log('✅ Saved user name:', name.trim());
      }

      await onStartStudying(courseCode.trim().toUpperCase(), workingOn.trim() || 'Studying', location.trim());
    } catch (e) {
      console.error('Error starting session:', e);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#courseCode') && !event.target.closest('.course-dropdown')) {
        setShowCourseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find McGill Students Studying Your Course Right Now
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with classmates studying the same material, in real-time
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-mono font-semibold text-gray-900">{user.studentId}</p>
              {user.name && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Name</p>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </>
              )}
            </div>
          )}
          
          {!user?.name && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
              Course Code
            </label>
            <div className="relative">
              <input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setCourseCode(value);
                  setCourseSearch(value);
                  setShowCourseDropdown(true);
                }}
                onFocus={() => setShowCourseDropdown(true)}
                placeholder="e.g., COMP 251, MATH 240"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              {showCourseDropdown && (
                <div className="course-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {mcgillCourses
                    .filter(course => 
                      courseSearch === '' || course.toLowerCase().includes(courseSearch.toLowerCase())
                    )
                    .slice(0, 100)
                    .map((course) => (
                      <button
                        key={course}
                        type="button"
                        onClick={() => {
                          setCourseCode(course);
                          setCourseSearch('');
                          setShowCourseDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                      >
                        {course}
                      </button>
                    ))}
                  {mcgillCourses.filter(course => 
                    courseSearch === '' || course.toLowerCase().includes(courseSearch.toLowerCase())
                  ).length === 0 && courseSearch !== '' && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No courses found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCourseDropdown(!showCourseDropdown)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              {showCourseDropdown ? 'Hide' : 'Show'} course list
            </button>
          </div>

          <div>
            <label htmlFor="workingOn" className="block text-sm font-medium text-gray-700 mb-2">
              What are you working on? (Optional)
            </label>
            <input
              id="workingOn"
              type="text"
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value)}
              placeholder="e.g., Midterm review, Assignment 3"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Where are you studying? (Optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., McLennan Library, Redpath Library, Online"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Starting...' : 'Start Studying'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-blue-600">{liveCount}</span> students studying right now
          </p>
        </div>

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

export default Landing;

