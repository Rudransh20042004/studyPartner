import { useState, useEffect } from 'react';
import { mcgillCourses } from '../data/courses';
import { supabase } from '../lib/supabaseClient';

const Landing = ({ onStartStudying, user, onLogout }) => {
  const [courseCode, setCourseCode] = useState('');
  const [workingOn, setWorkingOn] = useState('');
  const [location, setLocation] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  // Inline profile completion
  const [profileName, setProfileName] = useState('');
  const [profileStudentId, setProfileStudentId] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    // Load current profile to decide if we need inline completion
    const loadProfile = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data: prof } = await supabase
          .from('profiles')
          .select('student_id, full_name')
          .eq('user_id', authUser.id)
          .maybeSingle();
        if (prof?.full_name && prof?.student_id) {
          setProfileName(prof.full_name || '');
          setProfileStudentId(prof.student_id || '');
          setProfileComplete(true);
        } else {
          // Prefill name from metadata/email if available
          const raw =
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')?.[0]?.replace(/[._]/g, ' ') ||
            '';
          const fallbackName = raw
            .trim()
            .split(/\s+/)
            .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
            .join(' ');
          setProfileName(fallbackName);
          setProfileComplete(false);
        }
      } catch {
        // keep silent; user can still enter values
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    // Update live count every 5 seconds (Supabase-based count)
    const updateCount = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true });
        if (error) {
          console.error('Count error:', error);
        }
        setLiveCount((data && data.length) || 0);
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
    
    if (!courseCode.trim()) {
      alert('Please enter a course code');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        alert('Please login first');
        setIsLoading(false);
        return;
      }
      // Ensure profile exists and is complete; if not, try saving it inline
      if (!profileComplete || !profileName || !profileStudentId) {
        if (!profileName.trim() || profileStudentId.trim().length !== 9) {
          setIsLoading(false);
          alert('Please complete your profile (full name and 9‑digit Student ID).');
          return;
        }
        try {
          await supabase.from('profiles').upsert({
            user_id: authUser.id,
            full_name: profileName.trim(),
            student_id: profileStudentId.trim(),
          });
          setProfileComplete(true);
        } catch (err) {
          console.error('Profile save failed', err);
          setIsLoading(false);
          alert('Could not save profile. Please try again.');
          return;
        }
      }

      // Continue to start studying with collected info
      await onStartStudying(
        courseCode.trim().toUpperCase(),
        workingOn.trim() || 'Studying',
        location.trim()
      );
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'linear-gradient(180deg, #fff6f7 0%, #ffffff 100%)'}}>
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find peers in your courses instantly.
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with classmates studying the same material, in real-time
          </p>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
              title="Sign out"
            >
              Sign out
            </button>
          )}
        </div>

        {!profileComplete && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 border border-red-200">
            <h3 className="font-semibold text-gray-900">Complete your profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID (9 digits)</label>
                <input
                  value={profileStudentId}
                  onChange={(e) => setProfileStudentId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="260123456"
                  maxLength={9}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setProfileSaving(true);
                try {
                  const { data: { user: authUser } } = await supabase.auth.getUser();
                  if (!authUser) throw new Error('Please login first');
                  if (!profileName.trim() || profileStudentId.trim().length !== 9) {
                    throw new Error('Enter full name and a 9‑digit Student ID');
                  }
                  // Uniqueness check
                  const { data: conflict } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('student_id', profileStudentId.trim())
                    .neq('user_id', authUser.id)
                    .maybeSingle();
                  if (conflict) {
                    throw new Error('This Student ID is already in use by another account.');
                  }
                  await supabase.from('profiles').upsert({
                    user_id: authUser.id,
                    full_name: profileName.trim(),
                    student_id: profileStudentId.trim(),
                  });
                  setProfileComplete(true);
                } catch (err) {
                  alert(err?.message || 'Failed to save profile');
                } finally {
                  setProfileSaving(false);
                }
              }}
              disabled={profileSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          
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

        
      </div>
    </div>
  );
};

export default Landing;

