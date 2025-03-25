import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { createUserAgent } from '../lib/database';
import type { QuestionnaireData } from '../types';
import QuestionnaireStep from './QuestionnaireStep';
import { createLLM, createAgent } from '../api/retell';
import { generatePrompt } from '../utils/promptHandler';

const steps = [
  {
    title: 'General Practice Information',
    fields: [
      { name: 'clinicInfo.clinicName', label: 'What is the name of the clinic?', type: 'text', placeholder: 'Enter clinic name', required: true },
      { name: 'clinicInfo.useClinicNameInGreeting', label: 'Would you like the agent to mention it in the greeting?', type: 'boolean' },
      { name: 'clinicInfo.operatingHours.start', label: 'What are your clinic\'s operating hours? (24-hour format)', type: 'time', placeholder: '09:00', required: true },
      { name: 'clinicInfo.operatingHours.end', label: 'End time (24-hour format)', type: 'time', placeholder: '17:00', required: true },
      { name: 'clinicInfo.holidays', label: 'Are there specific days off or holidays observed?', type: 'textarea', placeholder: 'List your holidays and special closures' },
      { name: 'clinicInfo.communicationStyle', label: 'What tone or style should the agent adopt?', type: 'select', options: ['Warm and welcoming', 'Professional', 'Casual'], required: true },
      { name: 'clinicInfo.phrasesToUse', label: 'What specific phrases would you like the agent to use?', type: 'textarea', placeholder: 'List preferred phrases' },
      { name: 'clinicInfo.phrasesToAvoid', label: 'What specific phrases would you like the agent to avoid?', type: 'textarea', placeholder: 'List phrases to avoid' }
    ]
  },
  {
    title: 'Common Questions and Information',
    fields: [
      { name: 'services.commonServices', label: 'What are the most common services or procedures patients usually inquire about?', type: 'textarea', placeholder: 'List common services and procedures', required: true },
      { name: 'services.standardResponses', label: 'Are there standard responses to frequently asked questions?', type: 'textarea', placeholder: 'Enter standard responses to FAQs' },
      { name: 'services.procedureDescriptions', label: 'Should the agent provide brief descriptions of each procedure?', type: 'boolean' }
    ]
  },
  {
    title: 'Appointment Booking and Scheduling',
    fields: [
      { name: 'appointments.appointmentTypes', label: 'What types of appointments can the AI agent schedule directly?', type: 'textarea', placeholder: 'List appointment types (e.g., consultations, follow-ups)', required: true },
      { name: 'appointments.appointmentDuration', label: 'How many minutes should be allocated for each appointment?', type: 'number', min: 5, max: 240, step: 5, placeholder: '30', required: true },
      { name: 'appointments.schedulingSystem', label: 'What scheduling system does the clinic use?', type: 'text', placeholder: 'Enter scheduling system name' },
      { name: 'appointments.requireContactDetails', label: 'Should the agent confirm patient\'s contact details before scheduling?', type: 'boolean' }
    ]
  },
  {
    title: 'Patient Screening',
    fields: [
      { name: 'screening.requirements', label: 'Are there any requirements or qualifications for scheduling an appointment?', type: 'textarea', placeholder: 'List requirements (e.g., age, medical history)' },
      { name: 'screening.healthConditions', label: 'Should the agent ask about specific health conditions?', type: 'textarea', placeholder: 'List relevant health conditions to screen for' }
    ]
  },
  {
    title: 'Privacy and Sensitive Information',
    fields: [
      { name: 'privacy.privacyPhrases', label: 'What specific phrases should be used to address privacy concerns?', type: 'textarea', placeholder: 'Enter privacy assurance phrases', required: true },
      { name: 'privacy.fallbackResponse', label: 'How should the agent respond to questions it cannot answer?', type: 'textarea', placeholder: 'Enter fallback response protocol', required: true }
    ]
  },
  {
    title: 'Language and Agent Settings',
    fields: [
      { name: 'language.primaryLanguage', label: 'What should be the primary language?', type: 'select', options: ['en-US', 'es-ES'], labels: ['English', 'Spanish'], required: true },
      { name: 'language.offerEnglish', label: 'Would you like to offer English as an alternative?', type: 'boolean' },
      { name: 'language.agentName', label: 'What name would you like to give your agent?', type: 'text', placeholder: 'Enter agent name (optional)' }
    ]
  },
  {
    title: 'Follow-ups and Reminders',
    fields: [
      { 
        name: 'followUp.sendReminders', 
        label: 'Would you like the agent to send appointment reminders?', 
        type: 'boolean',
        required: true,
        description: 'This will enable the email notification system for appointment reminders'
      },
      { 
        name: 'followUp.sendConfirmation', 
        label: 'Should the agent confirm appointments with a follow-up message?', 
        type: 'boolean' 
      }
    ]
  },
  {
    title: 'Cancellations',
    fields: [
      { name: 'cancellation.allowRescheduling', label: 'Should the agent be able to cancel or reschedule appointments?', type: 'boolean' },
      { name: 'cancellation.cancellationPolicy', label: 'What are the cancellation policies or fees?', type: 'textarea', placeholder: 'Enter cancellation policy details' }
    ]
  },
  {
    title: 'Emergency Protocols',
    fields: [
      { name: 'emergency.emergencyResponse', label: 'How should the agent respond to potential medical emergencies?', type: 'textarea', placeholder: 'Enter emergency response protocol', required: true },
      { name: 'emergency.afterHoursContact', label: 'What after-hours contact information should be provided?', type: 'text', placeholder: 'Enter after-hours contact information', required: true }
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agentId: string, llmId: string, prompt: string) => void;
  initialData?: QuestionnaireData | null;
  onUpdate?: (data: QuestionnaireData) => void;
}

export default function QuestionnaireModal({ 
  isOpen, 
  onClose, 
  onAgentCreated, 
  initialData,
  onUpdate 
}: Props) {
  const [user] = useAuthState(auth);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<QuestionnaireData>({
    defaultValues: initialData || {
      clinicInfo: {
        communicationStyle: 'Professional',
      },
      language: {
        primaryLanguage: 'en-US',
      },
      appointments: {
        appointmentDuration: 30,
      }
    }
  });

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            setValue(`${key}.${subKey}` as any, subValue);
          });
        } else {
          setValue(key as any, value);
        }
      });
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: QuestionnaireData) => {
    if (!user) {
      setError('You must be logged in to create an agent');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      if (currentStep === steps.length - 1) {
        if (initialData && onUpdate) {
          await onUpdate(data);
          onClose();
        } else {
          const newLlmId = await createLLM(data);
          
          if (!newLlmId) {
            throw new Error('Failed to create LLM');
          }
          
          const newAgentId = await createAgent(newLlmId, {
            agent_name: data.language?.agentName?.trim() || undefined,
            language: data.language?.primaryLanguage || 'en-US'
          });
          
          if (!newAgentId) {
            throw new Error('Failed to create agent');
          }

          await createUserAgent(user.uid, newAgentId, newLlmId, data);

          const initialPrompt = generatePrompt(data);
          
          onAgentCreated(newAgentId, newLlmId, initialPrompt);
          onClose();
        }
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating/updating agent:', error);
      setError(error instanceof Error ? error.message : 'Failed to create/update agent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{currentStepData.title}</h2>
            <p className="text-sm text-gray-500 mt-1">Step {currentStep + 1} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <QuestionnaireStep
              fields={currentStepData.fields}
              register={register}
              errors={errors}
              setValue={setValue}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0 || isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {currentStep === steps.length - 1 ? 'Creating Agent...' : 'Saving...'}
                </>
              ) : (
                currentStep === steps.length - 1 ? 'Create Agent' : 'Next'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}