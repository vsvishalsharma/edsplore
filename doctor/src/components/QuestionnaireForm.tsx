import React from 'react';
import { useForm } from 'react-hook-form';
import { Stethoscope } from 'lucide-react';
import type { QuestionnaireData } from '../types';
import { createLLM, createAgent } from '../api/retell';

export default function QuestionnaireForm() {
  const { register, handleSubmit } = useForm<QuestionnaireData>();

  const onSubmit = async (data: QuestionnaireData) => {
    try {
      // First create the LLM
      const llmId = await createLLM();
      
      // Then create the agent
      const agentId = await createAgent(llmId);
      
      // Save the questionnaire data along with the agent ID
      // This would typically go to your backend/database
      console.log('Form submitted:', { ...data, agentId });
    } catch (error) {
      console.error('Error creating agent:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-center space-x-4 mb-8">
        <Stethoscope className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Medical Practice Questionnaire</h1>
      </div>

      {/* General Practice Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">General Practice Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Clinic Name</label>
            <input
              {...register('clinicInfo.clinicName')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Operating Hours</label>
            <input
              {...register('clinicInfo.operatingHours')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Common Services</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Most Common Services</label>
          <textarea
            {...register('services.commonServices')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
          />
        </div>
      </section>

      {/* Appointments */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Appointment Settings</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Scheduling System</label>
          <input
            {...register('appointments.schedulingSystem')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Privacy Settings</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Privacy Assurance Phrases</label>
          <textarea
            {...register('privacy.privacyPhrases')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </section>

      {/* Emergency Handling */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Emergency Protocols</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Emergency Response Protocol</label>
          <textarea
            {...register('emergency.emergencyResponse')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Agent
        </button>
      </div>
    </form>
  );
}