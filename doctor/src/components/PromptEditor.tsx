import React, { useState, useEffect } from 'react';
import { Pencil, Loader2, Trash2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import Retell from 'retell-sdk';
import { auth } from '../lib/firebase';
import { deleteUserAgent, getUserAgent, updateUserAgentQuestionnaire } from '../lib/database';
import CurrentVoice from './CurrentVoice';
import QuestionnaireModal from './QuestionnaireModal';
import { generatePrompt } from '../utils/promptHandler';
import type { QuestionnaireData } from '../types';
import CallButton from './CallButton';

const client = new Retell({
  apiKey: import.meta.env.VITE_RETELL_API_KEY,
});

// Define language model types to match API requirements
type ModelType = 'gpt-4o' | 'gpt-4o-mini' | 'claude-3.5-sonnet' | 'claude-3-haiku' | 'claude-3.5-haiku';

// Define language types to match API requirements
type LanguageType = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'nl-NL' | 'pl-PL' | 'ru-RU' | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'ar-SA' | 'hi-IN';

const LANGUAGE_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4 Optimized' },
  { value: 'gpt-4o-mini', label: 'GPT-4 Optimized Mini' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' }
] as const;

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'hi-IN', label: 'Hindi' }
] as const;

interface Props {
  llmId?: string;
  agentId?: string;
  initialPrompt?: string;
  onPromptUpdate?: (newPrompt: string) => void;
  onAgentDelete?: () => void;
}

export default function PromptEditor({ 
  llmId: initialLlmId = "", 
  agentId: initialAgentId = "", 
  initialPrompt = "", 
  onPromptUpdate = () => {}, 
  onAgentDelete 
}: Props) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelType>('gpt-4o');
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageType>('en-US');
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [agentId, setAgentId] = useState(initialAgentId);
  const [llmId, setLlmId] = useState(initialLlmId);
  const [noAgentFound, setNoAgentFound] = useState(false);

  useEffect(() => {
    const fetchUserAgent = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        // Try to get the agent from user data if not provided in props
        if (!agentId || !llmId) {
          const userAgent = await getUserAgent(user.uid);
          if (userAgent?.agentId && userAgent?.llmId) {
            setAgentId(userAgent.agentId);
            setLlmId(userAgent.llmId);
            if (userAgent.questionnaireData) {
              setQuestionnaireData(userAgent.questionnaireData);
            }
          } else {
            // No agent found for this user
            setNoAgentFound(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user agent:', error);
        setError('Failed to load user agent data.');
        setIsLoading(false);
      }
    };

    fetchUserAgent();
  }, [user, initialAgentId, initialLlmId, agentId, llmId]);

  // Implementing the missing fetchAgentDetails function
  const fetchAgentDetails = async () => {
    if (!agentId || !llmId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [agentResponse, llmResponse] = await Promise.all([
        client.agent.retrieve(agentId),
        client.llm.retrieve(llmId)
      ]);

      if (agentResponse) {
        setAgentName(agentResponse.agent_name || '');
        // Cast language to ensure it's a valid LanguageType
        const language = agentResponse.language as LanguageType;
        if (language) {
          setCurrentLanguage(language);
        }
      }

      if (llmResponse) {
        // Cast model to ensure it's a valid ModelType
        const model = llmResponse.model as ModelType;
        if (model) {
          setCurrentModel(model);
        }
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
      setError('Failed to load agent details. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agentId && llmId) {
      fetchAgentDetails();
    }
  }, [agentId, llmId]);

  const handleNameChange = async (newName: string) => {
    if (!newName.trim() || !agentId) return;
    
    setIsUpdatingName(true);
    setError(null);
    try {
      await client.agent.update(agentId, {
        agent_name: newName.trim()
      });
      setAgentName(newName.trim());
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating agent name:', error);
      setError('Failed to update agent name. Please try again.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLanguageChange = async (newLanguage: LanguageType) => {
    if (!agentId) return;
    
    setIsUpdatingLanguage(true);
    setError(null);
    try {
      await client.agent.update(agentId, {
        language: newLanguage
      });
      setCurrentLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language:', error);
      setError('Failed to update language. Please try again.');
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  const handleModelChange = async (newModel: ModelType) => {
    if (!llmId) return;
    
    setIsUpdatingModel(true);
    setError(null);
    try {
      await client.llm.update(llmId, {
        model: newModel
      });
      setCurrentModel(newModel);
    } catch (error) {
      console.error('Error updating model:', error);
      setError('Failed to update model. Please try again.');
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!user?.uid || !agentId || !llmId) return;
    
    if (!window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await client.agent.delete(agentId);
      await client.llm.delete(llmId);
      await deleteUserAgent(user.uid);
      onAgentDelete?.();
    } catch (error) {
      console.error('Error deleting agent:', error);
      setError('Failed to delete agent. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuestionnaireUpdate = async (newData: QuestionnaireData) => {
    if (!user?.uid) return;
    
    try {
      // If we don't have an agent yet, we need to create one
      if (noAgentFound) {
        setIsQuestionnaireOpen(false);
        // Logic to create a new agent would go here
        // This would be similar to what's in your QuestionnaireModal component
        return;
      }
      
      await updateUserAgentQuestionnaire(user.uid, newData);
      setQuestionnaireData(newData);
      const newPrompt = generatePrompt(newData);
      onPromptUpdate(newPrompt);
      
      // Update agent name and language if changed
      if (newData.language?.agentName !== agentName) {
        await handleNameChange(newData.language?.agentName || '');
      }
      if (newData.language?.primaryLanguage !== currentLanguage) {
        // Type safety check - ensure primaryLanguage is a valid LanguageType
        const newLanguage = newData.language?.primaryLanguage as LanguageType;
        if (newLanguage && LANGUAGES.some(lang => lang.value === newLanguage)) {
          await handleLanguageChange(newLanguage);
        }
      }
      
      // Update LLM with new prompt
      if (llmId) {
        await client.llm.update(llmId, {
          general_prompt: newPrompt
        });
      }
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      setError('Failed to update responses. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (noAgentFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No AI Assistant Found</h2>
          <p className="text-gray-600">You don't have an AI assistant set up yet.</p>
        </div>
        <button
          onClick={() => setIsQuestionnaireOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Your AI Assistant
        </button>
        
        <QuestionnaireModal
          isOpen={isQuestionnaireOpen}
          onClose={() => setIsQuestionnaireOpen(false)}
          onAgentCreated={(newAgentId, newLlmId, newPrompt) => {
            setAgentId(newAgentId);
            setLlmId(newLlmId);
            setNoAgentFound(false);
            // Fetch the newly created agent details
            fetchAgentDetails();
          }}
          initialData={null}
          onUpdate={handleQuestionnaireUpdate}
        />
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Agent Name */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {agentName || 'Unnamed Agent'}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              Agent ID: {agentId}
            </div>
          </div>

          {/* Language Model and Voice */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Language Model:
              </label>
              <select
                value={currentModel}
                onChange={(e) => handleModelChange(e.target.value as ModelType)}
                disabled={isUpdatingModel}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {LANGUAGE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              {isUpdatingModel && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Language:
              </label>
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as LanguageType)}
                disabled={isUpdatingLanguage}
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              {isUpdatingLanguage && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>

            <CurrentVoice agentId={agentId} />
          </div>

          {/* Interactive Orb */}
          <div className="flex justify-center py-12">
            <div 
              className="group relative w-64 h-64 cursor-pointer"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.1) 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 60px rgba(66, 153, 225, 0.3)',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              {/* Animated gradient background */}
              <div 
                className="absolute inset-0 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, #60A5FA, #3B82F6)',
                  filter: 'blur(20px)',
                  animation: 'pulse 2s infinite',
                }}
              />
              
              {/* Interactive glow effect */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-70"
                style={{
                  background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.8) 0%, transparent 50%)',
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                }}
              />

              {/* Glass effect overlay */}
              <div className="absolute inset-2 rounded-full bg-white bg-opacity-10 backdrop-blur-sm" />
            </div>
          </div>

          {/* Action Buttons - FIXED: Added CallButton to the same row as other buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsQuestionnaireOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <Pencil className="w-5 h-5" />
              Edit Responses
            </button>
            <button
              onClick={handleDeleteAgent}
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete Agent'}
            </button>
            <CallButton agentId={agentId} />
          </div>
        </div>
      </div>

      {/* Fixed style tag with proper formatting */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { transform: scale(0.95); }
            50% { transform: scale(1.05); }
            100% { transform: scale(0.95); }
          }
        `
      }} />

      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onAgentCreated={(newAgentId, newLlmId, newPrompt) => {
          // This can now be used for both creating and editing
          if (newAgentId && newLlmId) {
            setAgentId(newAgentId);
            setLlmId(newLlmId);
            window.location.reload(); // Reload to show the new agent
          }
        }}
        initialData={questionnaireData}
        onUpdate={handleQuestionnaireUpdate}
      />
    </div>
  );
}