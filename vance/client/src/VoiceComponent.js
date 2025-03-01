import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { Mic, MicOff } from 'lucide-react';

const API_URL =
  process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';

function VoiceChat() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retellClient, setRetellClient] = useState(null);
  // Keep transcript in state so it persists until page refresh
  const [transcript, setTranscript] = useState([]);

  const chatContentRef = useRef(null);

  const initializeClient = useCallback(() => {
    try {
      const client = new RetellWebClient();

      const handleCallStarted = () => {
        console.log('Call started');
        setIsCallActive(true);
        setIsLoading(false);
        setError(null);
        // Remove the line below to keep existing transcript:
        // setTranscript([]);
      };

      const handleCallEnded = () => {
        console.log('Call ended');
        setIsCallActive(false);
        setIsLoading(false);
        // Do NOT clear transcript here, so it persists after call ends.
      };

      const handleError = (error) => {
        console.error('Call error:', error);
        setError(error.message || 'An error occurred during the call');
        setIsLoading(false);
        setIsCallActive(false);
        client.stopCall();
      };

      const handleUpdate = (update) => {
        if (update.transcript) {
          if (Array.isArray(update.transcript)) {
            // If transcript is an array (of {role, content}), store it as-is
            setTranscript(update.transcript);
          } else if (typeof update.transcript === 'object') {
            // Single object => wrap it in an array
            setTranscript([update.transcript]);
          } else if (typeof update.transcript === 'string') {
            // Plain string => split by newline and assume 'assistant' role
            const messages = update.transcript
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((line) => ({
                role: 'assistant',
                content: line.trim(),
              }));
            setTranscript(messages);
          }
        }
      };

      // Attach event listeners
      client.on('call_started', handleCallStarted);
      client.on('call_ended', handleCallEnded);
      client.on('error', handleError);
      client.on('update', handleUpdate);

      setRetellClient(client);

      return () => {
        client.stopCall();
        client.off('call_started', handleCallStarted);
        client.off('call_ended', handleCallEnded);
        client.off('error', handleError);
        client.off('update', handleUpdate);
      };
    } catch (err) {
      console.error('Failed to initialize RetellWebClient:', err);
      setError(
        'Failed to initialize voice client. Please check your browser permissions.'
      );
      return () => {};
    }
  }, []);

  useEffect(() => {
    const cleanup = initializeClient();
    return cleanup;
  }, [initializeClient]);

  // Auto-scroll to bottom whenever transcript updates
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [transcript]);

  const startCall = async () => {
    try {
      if (!retellClient) throw new Error('Voice client not initialized');

      setIsLoading(true);
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const response = await fetch(`${API_URL}/api/create-web-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start call');
      if (!data.access_token) throw new Error('No access token received from server');

      await retellClient.startCall({
        accessToken: data.access_token,
        sampleRate: 24000,
        captureDeviceId: 'default',
        emitRawAudioSamples: false,
      });
    } catch (err) {
      console.error('Error starting call:', err);
      let errorMessage = err.message;
      if (err.name === 'NotAllowedError') {
        errorMessage =
          'Microphone access denied. Please allow microphone access and try again.';
      } else if (!navigator.onLine) {
        errorMessage =
          'No internet connection. Please check your connection and try again.';
      }
      setError(errorMessage);
      setIsLoading(false);
      retellClient?.stopCall();
    }
  };

  const stopCall = () => {
    if (retellClient && isCallActive) {
      retellClient.stopCall();
    }
  };

  return (
    <div className="container">
      <div className="mic-wrapper">
        <button
          className={`mic-button ${isLoading ? 'disabled' : ''}`}
          onClick={isCallActive ? stopCall : startCall}
          disabled={isLoading}
          aria-label={isCallActive ? 'Stop call' : 'Start call'}
        >
          {isCallActive ? (
            <MicOff className={`mic-icon ${isCallActive ? 'active' : ''}`} size={48} />
          ) : (
            <Mic className={`mic-icon ${isCallActive ? 'active' : ''}`} size={48} />
          )}
        </button>
      </div>

      {/* Chat-like transcript box - always visible so it doesn't disappear */}
      <div className="chat-box">
        <div className="chat-header">
          <h3>Voice Chat Transcript</h3>
        </div>
        <div className="chat-content" ref={chatContentRef}>
          {transcript.length > 0 ? (
            transcript.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="placeholder">
              {isCallActive ? 'Listening... Speak now.' : 'No messages yet.'}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="error-text">
          {error} {!isCallActive && '- Try refreshing the page'}
        </p>
      )}

      <style jsx>{`
        .container {
          /* Reduced height from 100vh to 80vh (adjust as needed) */
          height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(to bottom right, #faf5ff, #f3e8ff);
          padding: 1rem;
          margin: 0 auto;
        }

        .mic-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1rem; /* less space */
        }

        .mic-button {
          background: none;
          border: 2px solid transparent;
          border-radius: 50%;
          cursor: pointer;
          padding: 1rem;
          transition: all 0.2s ease;
          outline: none;
          /* Add a box-shadow for a pop-up effect */
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .mic-button:focus-visible {
          border-color: #4ded95;
        }

        .mic-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .mic-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .mic-icon {
          color: #4ded95;
          transition: color 0.2s ease;
        }

        .mic-icon.active {
          color: #2bd176;
          animation: pulse 2s infinite;
        }

        .chat-box {
          width: 100%;
          max-width: 500px;
          background: #f7f7f8;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          background: #4ded95;
          padding: 1rem;
          text-align: center;
        }

        .chat-header h3 {
          margin: 0;
          color: #fff;
          font-size: 1.2rem;
        }

        .chat-content {
          padding: 1rem;
          background: #fff;
          display: flex;
          flex-direction: column;
          /* Add scrolling */
          overflow-y: auto;
          max-height: 300px; /* Adjust as needed */
        }

        .chat-message {
          padding: 10px 16px;
          border-radius: 16px;
          margin: 8px 0;
          max-width: 80%;
          word-break: break-word;
        }

        /* Example roles: agent vs user (customize as needed) */
        .chat-message.agent {
          background-color: #e5e7eb;
          align-self: flex-start;
        }

        .chat-message.user {
          background-color: #4ded95;
          color: white;
          align-self: flex-end;
        }

        .placeholder {
          color: #aaa;
          font-style: italic;
          text-align: center;
        }

        .error-text {
          color: #ef4444;
          margin-top: 1rem;
          text-align: center;
          max-width: 500px;
          font-size: 0.9rem;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @media (max-width: 480px) {
          .chat-box {
            width: 90%;
          }
        }
      `}</style>
    </div>
  );
}

export default VoiceChat;
