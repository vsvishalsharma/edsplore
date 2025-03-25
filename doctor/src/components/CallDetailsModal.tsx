import React from 'react';
import { X, Download, Clock, User, Phone } from 'lucide-react';

interface Call {
  agent_id: string;
  call_id: string;
  start_timestamp: number;
  end_timestamp: number;
  recording_url: string;
  disconnection_reason: string;
  call_analysis: {
    call_summary: string;
    user_sentiment: string;
    agent_sentiment: string;
    agent_task_completion_rating: string;
    agent_task_completion_rating_reason: string;
    call_completion_rating: string;
    call_completion_rating_reason: string;
  };
}

interface Props {
  call: Call;
  onClose: () => void;
}

export default function CallDetailsModal({ call, onClose }: Props) {
  const calculateDuration = (start: number, end: number) => {
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.call_id}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl}
              alt="Caller avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Call Details</h2>
              <p className="text-sm text-gray-500">
                {new Date(call.start_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium">Call ID</span>
              </div>
              <p className="text-sm font-mono">{call.call_id}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Agent ID</span>
              </div>
              <p className="text-sm font-mono">{call.agent_id}</p>
            </div>
          </div>

          {/* Avatar URL */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Avatar URL</span>
            </div>
            <p className="text-sm font-mono break-all">{avatarUrl}</p>
          </div>

          {/* Audio Player */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Recording</span>
              <a
                href={call.recording_url}
                download
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </div>
            <audio controls className="w-full">
              <source src={call.recording_url} type="audio/wav" />
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Call Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Call Analysis</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Summary</h4>
                <p className="text-sm text-gray-600 mt-1">{call.call_analysis.call_summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">User Sentiment</h4>
                  <p className="text-sm text-gray-600 mt-1">{call.call_analysis.user_sentiment}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Agent Sentiment</h4>
                  <p className="text-sm text-gray-600 mt-1">{call.call_analysis.agent_sentiment}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Task Completion</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {call.call_analysis.agent_task_completion_rating} - {call.call_analysis.agent_task_completion_rating_reason}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Call Completion</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {call.call_analysis.call_completion_rating} - {call.call_analysis.call_completion_rating_reason}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Disconnection Reason</h4>
                <p className="text-sm text-gray-600 mt-1">{call.disconnection_reason}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}