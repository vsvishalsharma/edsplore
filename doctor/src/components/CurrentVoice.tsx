import React, { useState, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import Retell from 'retell-sdk';
import VoiceInfo from './VoiceInfo';

const client = new Retell({
  apiKey: import.meta.env.VITE_RETELL_API_KEY,
});

interface Props {
  agentId: string;
}

export default function CurrentVoice({ agentId }: Props) {
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('');
  const [currentVoiceId, setCurrentVoiceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchCurrentVoice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // First get the agent details to get the voice_id
        const agentResponse = await client.agent.retrieve(agentId);
        
        if (agentResponse?.voice_id) {
          setCurrentVoiceId(agentResponse.voice_id);
          // Then get the voice details using the voice_id
          const voiceResponse = await client.voice.retrieve(agentResponse.voice_id);
          setCurrentVoiceName(voiceResponse.voice_name);
        }
      } catch (error) {
        console.error('Error fetching current voice:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch current voice');
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) {
      fetchCurrentVoice();
    }
  }, [agentId]);

  const handleVoiceSelect = async (voiceId: string, voiceName: string) => {
    setIsUpdating(true);
    try {
      await client.agent.update(agentId, {
        voice_id: voiceId
      });
      setCurrentVoiceId(voiceId);
      setCurrentVoiceName(voiceName);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error updating voice:', error);
      alert('Failed to update voice. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Current Voice:</label>
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Current Voice:</label>
        <span className="text-sm text-red-500">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Current Voice:</label>
        <button
          onClick={() => setIsDropdownOpen(true)}
          disabled={isUpdating}
          className="flex items-center gap-1 text-sm text-gray-900 hover:text-blue-600 transition-colors focus:outline-none disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{currentVoiceName || 'No voice selected'}</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <VoiceInfo
        agentId={agentId}
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onVoiceSelect={handleVoiceSelect}
      />
    </div>
  );
}