import React from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Info } from 'lucide-react';
import type { QuestionnaireData } from '../types';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'time' | 'number';
  options?: string[];
  labels?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  description?: string;
}

interface Props {
  fields: Field[];
  register: UseFormRegister<QuestionnaireData>;
  errors: FieldErrors<QuestionnaireData>;
  setValue: UseFormSetValue<QuestionnaireData>;
}

export default function QuestionnaireStep({ fields, register, errors, setValue }: Props) {
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return (
    <div className="space-y-12">
      {fields.map((field) => (
        <div key={field.name} className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-grow">
              <label className="block text-xl font-medium text-blue-900 whitespace-pre-line mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <div className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{field.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {field.type === 'textarea' ? (
            <textarea
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false 
              })}
              placeholder={field.placeholder}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 placeholder-gray-400 min-h-[120px] p-4 ${
                getNestedValue(errors, field.name) 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              rows={6}
            />
          ) : field.type === 'boolean' ? (
            <select
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false 
              })}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 p-3 text-lg ${
                getNestedValue(errors, field.name)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : field.type === 'time' ? (
            <input
              type="time"
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false 
              })}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 p-3 text-lg ${
                getNestedValue(errors, field.name)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          ) : field.type === 'number' ? (
            <input
              type="number"
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false,
                min: field.min,
                max: field.max
              })}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 placeholder-gray-400 p-3 text-lg ${
                getNestedValue(errors, field.name)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          ) : field.type === 'select' && field.options ? (
            <select
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false 
              })}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 p-3 text-lg ${
                getNestedValue(errors, field.name)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            >
              <option value="">Select...</option>
              {field.options.map((option, index) => (
                <option key={option} value={option}>
                  {field.labels?.[index] || option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              {...register(field.name as any, { 
                required: field.required ? 'This field is required' : false 
              })}
              placeholder={field.placeholder}
              className={`mt-2 block w-full rounded-md border-2 shadow-sm text-gray-900 placeholder-gray-400 p-3 text-lg ${
                getNestedValue(errors, field.name)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          )}
          
          {getNestedValue(errors, field.name) && (
            <p className="mt-1 text-sm text-red-600">
              {getNestedValue(errors, field.name)?.message || 'This field is required'}
            </p>
          )}

          {field.type === 'number' && (field.min !== undefined || field.max !== undefined) && (
            <p className="mt-1 text-sm text-gray-500">
              {field.min !== undefined && field.max !== undefined
                ? `Value must be between ${field.min} and ${field.max}`
                : field.min !== undefined
                ? `Minimum value is ${field.min}`
                : `Maximum value is ${field.max}`}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}