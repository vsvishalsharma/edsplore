import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Play, Square, X } from 'lucide-react';
import Retell from 'retell-sdk';

const client = new Retell({
  apiKey: import.meta.env.VITE_RETELL_API_KEY,
});

interface Voice {
  voice_id: string;
  voice_name: string;
  preview_audio_url: string;
  avatar_url: string;
  accent: string;
  gender: string;
  age: string;
  provider: string;
}

interface Props {
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
  onVoiceSelect: (voiceId: string, voiceName: string) => void;
}

export default function VoiceInfo({ agentId, isOpen, onClose, onVoiceSelect }: Props) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    accent: '',
    type: ''
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const voiceResponses = await client.voice.list();
        setVoices(voiceResponses);
      } catch (error) {
        console.error('Error fetching voices:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch voices');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handlePreviewPlay = (voiceId: string, previewUrl: string) => {
    if (playingAudioId === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(previewUrl);
      audio.onended = () => {
        setPlayingAudioId(null);
        audioRef.current = null;
      };
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setPlayingAudioId(null);
      });
      audioRef.current = audio;
      setPlayingAudioId(voiceId);
    }
  };

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.voice_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !filters.gender || voice.gender === filters.gender;
    const matchesAccent = !filters.accent || voice.accent === filters.accent;
    const matchesType = !filters.type || voice.provider === filters.type;
    return matchesSearch && matchesGender && matchesAccent && matchesType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Select Voice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select
                  value={filters.accent}
                  onChange={(e) => setFilters(prev => ({ ...prev, accent: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Accent</option>
                  <option value="American">American</option>
                  <option value="British">British</option>
                  <option value="Indian">Indian</option>
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Types</option>
                  <option value="retell">Retell</option>
                  <option value="elevenlabs">ElevenLabs</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trait</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voice ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVoices.map((voice) => (
                      <tr 
                        key={voice.voice_id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onVoiceSelect(voice.voice_id, voice.voice_name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewPlay(voice.voice_id, voice.preview_audio_url);
                            }}
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                            title={playingAudioId === voice.voice_id ? "Stop Preview" : "Play Preview"}
                          >
                            {playingAudioId === voice.voice_id ? (
                              <Square className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={voice.avatar_url}
                                alt={`${voice.voice_name} avatar`}
                                onError={(e) => {
                                  // Fallback to a default avatar if the API avatar fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${voice.voice_name}`;
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {voice.voice_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {voice.accent}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {voice.age}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              {voice.provider}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {voice.voice_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}