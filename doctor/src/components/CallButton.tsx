import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { createCall } from '../api/retell';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { deductTokens, getUserTokens } from '../lib/database';

interface Props {
  agentId: string;
}

export default function CallButton({ agentId }: Props) {
  const [user] = useAuthState(auth);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitializingCall, setIsInitializingCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number>(0);
  const retellClientRef = useRef<RetellWebClient>(new RetellWebClient());
  const callStartTimeRef = useRef<number | null>(null);
  const lastTokenDeductionRef = useRef<number | null>(null);
  const tokenCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDeductingRef = useRef<boolean>(false);
  const deductionQueueRef = useRef<number>(0);

  useEffect(() => {
    const loadTokens = async () => {
      if (user?.uid) {
        try {
          const userTokens = await getUserTokens(user.uid);
          setTokens(userTokens?.tokens || 0);
        } catch (error) {
          console.error('Error loading tokens:', error);
          setTokens(0);
        }
      }
    };
    loadTokens();
  }, [user]);

  const cleanupCall = () => {
    if (tokenCheckIntervalRef.current) {
      clearInterval(tokenCheckIntervalRef.current);
      tokenCheckIntervalRef.current = null;
    }
    callStartTimeRef.current = null;
    lastTokenDeductionRef.current = null;
    isDeductingRef.current = false;
    deductionQueueRef.current = 0;
  };

  const deductTokenWithRetry = async (userId: string, retryCount = 3): Promise<boolean> => {
    for (let i = 0; i < retryCount; i++) {
      try {
        await deductTokens(userId, 1);
        return true;
      } catch (error) {
        if (i === retryCount - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  };

  useEffect(() => {
    const client = retellClientRef.current;

    client.on("call_started", () => {
      setIsCallActive(true);
      setIsInitializingCall(false);
      setError(null);
      callStartTimeRef.current = Date.now();
      lastTokenDeductionRef.current = Date.now();

      tokenCheckIntervalRef.current = setInterval(async () => {
        if (!user?.uid || !lastTokenDeductionRef.current || isDeductingRef.current) return;

        const now = Date.now();
        const secondsSinceLastDeduction = Math.floor((now - lastTokenDeductionRef.current) / 1000);

        if (secondsSinceLastDeduction >= 1) {
          isDeductingRef.current = true;
          deductionQueueRef.current = secondsSinceLastDeduction;

          try {
            while (deductionQueueRef.current > 0) {
              await deductTokenWithRetry(user.uid);
              deductionQueueRef.current--;
              lastTokenDeductionRef.current = Date.now();
              setTokens(prev => Math.max(0, prev - 1));
            }

            const currentTokens = await getUserTokens(user.uid);
            if (!currentTokens || currentTokens.tokens <= 0) {
              client.stopCall();
              cleanupCall();
              setError('Call ended: Out of tokens');
            }
          } catch (error) {
            console.error('Error deducting token:', error);
            client.stopCall();
            cleanupCall();
            setError('Error processing tokens. Call ended.');
          } finally {
            isDeductingRef.current = false;
          }
        }
      }, 100);
    });

    client.on("call_ended", () => {
      setIsCallActive(false);
      setError(null);
      cleanupCall();

      if (user?.uid) {
        getUserTokens(user.uid).then(userTokens => {
          setTokens(userTokens?.tokens || 0);
        });
      }
    });

    client.on("error", (error) => {
      console.error("Call error:", error);
      setError('Call error occurred. Please try again.');
      setIsCallActive(false);
      setIsInitializingCall(false);
      cleanupCall();
      client.stopCall();
    });

    return () => {
      if (isCallActive) {
        client.stopCall();
      }
      cleanupCall();
    };
  }, [user]);

  const handleCallToggle = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    try {
      const userTokens = await getUserTokens(user.uid);
      if (!userTokens || userTokens.tokens <= 0) {
        setError('Insufficient tokens. Please purchase more tokens to make calls.');
        return;
      }

      const client = retellClientRef.current;

      if (isCallActive) {
        client.stopCall();
        return;
      }

      setIsInitializingCall(true);
      setError(null);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        throw new Error('Microphone access denied. Please allow microphone access to start the call.');
      }

      const accessToken = await createCall(agentId);
      
      if (!accessToken) {
        throw new Error('Failed to get access token for the call.');
      }

      await client.startCall({
        accessToken,
        sampleRate: 24000
      });
    } catch (error) {
      console.error('Error handling call:', error);
      setError(error instanceof Error ? error.message : 'Failed to start call. Please try again.');
      setIsCallActive(false);
      setIsInitializingCall(false);
      cleanupCall();
    }
  };

  return (
    <div className="fixed left-72 bottom-8">
      <div className="flex flex-col items-center">
        <button
          onClick={handleCallToggle}
          disabled={isInitializingCall || tokens <= 0}
          className={`flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
            isCallActive 
              ? 'bg-red-500 hover:bg-red-600 text-white scale-110' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-110'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isInitializingCall ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isCallActive ? (
            <PhoneOff className="w-12 h-12" />
          ) : (
            <Phone className="w-12 h-12" />
          )}
        </button>
        
        {(error || isInitializingCall) && (
          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-gray-600">
              {isInitializingCall ? 'Starting call...' : ''}
            </div>
            {error && (
              <div className="mt-2 text-sm font-medium text-red-600 max-w-[200px] break-words">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}