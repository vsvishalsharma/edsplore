import Retell from 'retell-sdk';
import type { QuestionnaireData } from '../types';
import { generatePrompt } from '../utils/promptHandler';

const client = new Retell({
  apiKey: import.meta.env.VITE_RETELL_API_KEY,
});

export async function createLLM(data: QuestionnaireData) {
  try {
    const prompt = generatePrompt(data);
    
    // Base LLM configuration
    const llmConfig: any = {
      general_prompt: prompt
    };

    // Add email function only if reminders are enabled and value is "true"
    if (data.followUp.sendReminders === "true") {
      llmConfig.general_tools = [
        {
          description: "call this function to send details to the user and make sure the email is in the correct format.",
          name: "send_email",
          speak_after_execution: true,
          speak_during_execution: true,
          type: "custom",
          url: "https://hook.us2.make.com/gkqgef8hb63wo9jjdlkb0qklk24wc2ax",
          timeout_ms: 120000,
          parameters: {
            type: "object",
            properties: {
              email: {
                type: "string",
                format: "email",
                description: "The email address of the user in the correct format."
              }
            },
            required: ["email"]
          }
        }
      ];
    }

    const llmResponse = await client.llm.create(llmConfig);

    if (!llmResponse?.llm_id) {
      throw new Error('Failed to get LLM ID from response');
    }

    console.log('LLM created successfully:', llmResponse.llm_id);
    return llmResponse.llm_id;
  } catch (error: any) {
    console.error('Error creating LLM:', error);
    if (error?.status === 402) {
      throw new Error('Service is currently unavailable due to payment status. Please contact support.');
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create LLM');
  }
}

interface CreateAgentOptions {
  agent_name?: string;
  language?: string;
}

export async function createAgent(llmId: string, options: CreateAgentOptions = {}) {
  if (!llmId) {
    throw new Error('LLM ID is required');
  }

  try {
    const agentResponse = await client.agent.create({
      response_engine: { 
        llm_id: llmId, 
        type: 'retell-llm'
      },
      voice_id: '11labs-Adrian',
      agent_name: options.agent_name,
      language: options.language || 'en-US'
    });

    if (!agentResponse?.agent_id) {
      throw new Error('Failed to get agent ID from response');
    }

    console.log('Agent created successfully:', agentResponse.agent_id);
    return agentResponse.agent_id;
  } catch (error: any) {
    console.error('Error creating agent:', error);
    if (error?.status === 422) {
      throw new Error('Invalid configuration provided. Please check your settings and try again.');
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to create agent');
  }
}

export async function createCall(agentId: string) {
  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  try {
    console.log('Creating web call for agent:', agentId);
    const webCallResponse = await client.call.createWebCall({ 
      agent_id: agentId 
    });

    if (!webCallResponse?.access_token) {
      throw new Error('No access token received');
    }

    console.log('Web call created successfully');
    return webCallResponse.access_token;
  } catch (error: any) {
    console.error('Error creating web call:', {
      error: error instanceof Error ? error.message : error,
      status: error?.status,
      agentId
    });

    if (error?.status === 402) {
      throw new Error('Service is currently unavailable due to payment status. Please contact support.');
    } else if (error?.status === 422) {
      throw new Error('Invalid agent configuration. Please check your settings and try again.');
    }
    
    throw new Error('Failed to create call. Please try again later.');
  }
}