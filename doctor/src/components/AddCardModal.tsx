import React, { useState, useEffect, useRef } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { updateCustomerDefaultPaymentMethod } from '../lib/stripe';

interface Props {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function AddCardModal({ customerId, onClose, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [card, setCard] = useState<StripeCardElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const submitAttempted = useRef(false);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) throw new Error('Failed to load Stripe');
        setStripe(stripeInstance);
        
        const elementsInstance = stripeInstance.elements();
        setElements(elementsInstance);
      } catch (err) {
        console.error('Error initializing Stripe:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment form');
      }
    };

    initStripe();
  }, []);

  // Mount card element
  useEffect(() => {
    if (!elements || !cardElementRef.current) return;

    const cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    cardElement.mount(cardElementRef.current);
    setCard(cardElement);

    cardElement.on('change', (event) => {
      if (event.error) {
        setError(event.error.message);
      } else {
        setError(null);
      }
    });

    return () => {
      cardElement.unmount();
    };
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !card || submitAttempted.current || isLoading) return;
    
    submitAttempted.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Set as default payment method
      await updateCustomerDefaultPaymentMethod(customerId, paymentMethod.id);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding card:', err);
      setError(err instanceof Error ? err.message : 'Failed to add card');
      submitAttempted.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Payment Method</h3>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div 
              ref={cardElementRef}
              className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !stripe || !card}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Add Card'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}