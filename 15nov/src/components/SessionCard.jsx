import { Clock, MapPin } from 'lucide-react';

const SessionCard = ({ session, onConnect }) => {
  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
  };

  const getFirstName = (name) => {
    return name.split(' ')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            session.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {getFirstName(session.name)}
            </h3>
            {session.studentId && (
              <p className="text-xs font-mono text-gray-500">
                {session.studentId}
              </p>
            )}
            <p className="text-sm font-mono text-blue-600 font-semibold">
              {session.courseCode}
            </p>
          </div>
        </div>
      </div>

      {session.workingOn && (
        <p className="text-gray-700 mb-2 text-sm">
          {session.workingOn}
        </p>
      )}

      {session.location && (
        <div className="flex items-center gap-1 text-gray-600 mb-4 text-sm">
          <MapPin className="w-3 h-3" />
          <span>{session.location}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Clock className="w-3 h-3" />
          <span>Active {getTimeAgo(session.lastActive)}</span>
        </div>
        <button
          onClick={() => onConnect(session)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default SessionCard;

