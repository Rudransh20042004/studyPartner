import { useState } from 'react';
import { X, MapPin } from 'lucide-react';

const ConnectModal = ({ session, onClose }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setIsSending(true);
    // Simulate sending (for MVP, just show success)
    setTimeout(() => {
      alert(`Message sent! Your message will be visible to ${session.name}.`);
      setIsSending(false);
      onClose();
    }, 500);
  };

  if (!session) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Connect with {session.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Course</p>
            <p className="font-mono font-semibold text-blue-600">{session.courseCode}</p>
          </div>

          {session.workingOn && (
            <div>
              <p className="text-sm text-gray-500">Working on</p>
              <p className="text-gray-900">{session.workingOn}</p>
            </div>
          )}

          {session.location && (
            <div>
              <p className="text-sm text-gray-500">Where</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{session.location}</p>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                session.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
              }`}></div>
              <span className="text-gray-900 capitalize">{session.status === 'active' ? 'Studying Now' : 'Taking a Break'}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey! Want to study together at McLennan?"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Your message will be visible to {session.name}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;

