import React, { useState, useEffect } from 'react';
import { Clock, Phone, ExternalLink, Search, Download } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { getUserAgent } from '../lib/database';
import CallDetailsModal from './CallDetailsModal';
import Retell from 'retell-sdk';

const client = new Retell({
  apiKey: import.meta.env.VITE_RETELL_API_KEY,
});


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
  setCurrentPage: (page: string) => void;
}

export default function Dashboard({ setCurrentPage }: Props) {
  const [user] = useAuthState(auth);
  const [agentData, setAgentData] = useState<{ agentId: string; llmId: string } | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.uid) return;
      
      try {
        const userAgent = await getUserAgent(user.uid);
        if (userAgent) {
          setAgentData({
            agentId: userAgent.agentId,
            llmId: userAgent.llmId
          });
        }
      } catch (error) {
        console.error('Error fetching agent data:', error);
        setError('Failed to fetch agent data');
      }
    };

    fetchAgentData();
  }, [user]);

  /*useEffect(() => {
    const fetchCalls = async () => {
      if (!agentData?.agentId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://api.retellai.com/calls?agent_id=${agentData.agentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const agentCalls = Array.isArray(data) ? data.filter((call: Call) => call.agent_id === agentData.agentId) : [];
        setCalls(agentCalls);
      } catch (error) {
        console.error('Error fetching calls:', error);
        setError('Failed to fetch calls. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();
  }, [agentData]);*/
  useEffect(() => {
    const fetchCalls2 = async () => {
      if (!agentData?.agentId) return;
  
      setIsLoading(true);
      setError(null);
  
      try {
        // Using the client SDK with proper filtering for specific agent ID
        const response = await client.call.list({
          filter_criteria: {
            agent_id: [agentData.agentId]
          }
        });
  
        // Validate and process the response
        if (response && Array.isArray(response)) {
          setCalls(response);
        } else {
          setCalls([]);
          console.warn('Unexpected response format:', response);
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
        setError('Failed to fetch calls. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchCalls2();
  }, [agentData]);

  const calculateDuration = (start: number, end: number) => {
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAverageDuration = () => {
    if (calls.length === 0) return '0:00';
    const totalDuration = calls.reduce((acc, call) => {
      return acc + (call.end_timestamp - call.start_timestamp);
    }, 0);
    const avgDurationMs = totalDuration / calls.length;
    const minutes = Math.floor(avgDurationMs / 60000);
    const seconds = Math.floor((avgDurationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredCalls = calls.filter(call => 
    call.call_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Agent Info and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {agentData ? 'AI Assistant' : 'No Agent Created'}
              </h2>
              {agentData ? (
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-500">Agent ID: {agentData.agentId}</p>
                  <p className="text-sm text-gray-500">LLM ID: {agentData.llmId}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Create an agent to see analytics</p>
              )}
            </div>
            <button
              onClick={() => setCurrentPage('ai')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Call Duration</p>
              <p className="text-2xl font-semibold text-gray-900">{getAverageDuration()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{calls.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Call ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter call ID..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading calls...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Avatar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recording</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => {
                  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.call_id}`;
                  return (
                    <tr
                      key={call.call_id}
                      onClick={() => setSelectedCall(call)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={avatarUrl}
                          alt="Caller avatar"
                          className="w-8 h-8 rounded-full"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{call.call_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(call.start_timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {calculateDuration(call.start_timestamp, call.end_timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={call.recording_url}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          download
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
}