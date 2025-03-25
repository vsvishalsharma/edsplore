import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLocation } from 'react-router-dom';
import { CreditCard, Check, Loader2, AlertCircle, Shield, Plus, RefreshCw, Coins } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getUserTokens } from '../lib/database';
import { 
  TOKEN_PLAN,
  CARD_BRAND_IMAGES,
  createTokenCheckoutSession,
  retrieveCheckoutSession,
  handleTokenPurchaseComplete,
  getCustomerInvoices,
  getCustomerPaymentMethods,
  getLatestPaymentAndTokens,
  getStripeInstance,
  updateCustomerDefaultPaymentMethod
} from '../lib/stripe';
import AddCardModal from './AddCardModal';

interface Invoice {
  id: string;
  amount_paid: number;
  status: string;
  created: number;
  receipt_url: string | null;
  description: string;
}

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  isDefault?: boolean;
}

export default function PaymentsPage() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const [tokenData, setTokenData] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHandlingCheckout, setIsHandlingCheckout] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;

      try {
        setIsLoading(true);
        setError(null);
        const userTokens = await getUserTokens(user.uid);
        
        if (userTokens?.customerId) {
          const [paymentDetails, invoiceList, methods] = await Promise.all([
            getLatestPaymentAndTokens(userTokens.customerId),
            getCustomerInvoices(userTokens.customerId),
            getCustomerPaymentMethods(userTokens.customerId)
          ]);

          setTokenData({
            ...userTokens,
            lastPaymentDate: paymentDetails.latestPaymentDate,
            lastChargeAmount: paymentDetails.latestChargeAmount
          });
          setInvoices(invoiceList);
          setPaymentMethods(methods);
        } else {
          setTokenData(userTokens || { tokens: 0 });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isHandlingCheckout) {
      loadData();
    }
  }, [user, isHandlingCheckout]);

  // Handle token purchase
  const handleTokenPurchase = async () => {
    if (!user?.email) {
      setError('User email not found');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const currentTokens = await getUserTokens(user.uid);
      const session = await createTokenCheckoutSession(
        user.email,
        currentTokens?.customerId
      );

      if (!session?.id) {
        throw new Error('Failed to create checkout session');
      }

      const stripe = await getStripeInstance();
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      await stripe.redirectToCheckout({
        sessionId: session.id
      });
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout process');
      setIsProcessing(false);
    }
  };

  // Handle successful checkout
  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      const params = new URLSearchParams(location.search);
      const sessionId = params.get('session_id');

      if (sessionId && user?.uid && !isHandlingCheckout) {
        try {
          setIsHandlingCheckout(true);
          setIsLoading(true);
          setError(null);
          
          const session = await retrieveCheckoutSession(sessionId);
          
          if (session.payment_status === 'paid') {
            await handleTokenPurchaseComplete(session, user.uid);
            
            // Remove session_id from URL
            window.history.replaceState({}, '', '/payments');
            
            // Force reload data after successful purchase
            const updatedTokens = await getUserTokens(user.uid);
            if (updatedTokens?.customerId) {
              const [paymentDetails, invoiceList, methods] = await Promise.all([
                getLatestPaymentAndTokens(updatedTokens.customerId),
                getCustomerInvoices(updatedTokens.customerId),
                getCustomerPaymentMethods(updatedTokens.customerId)
              ]);

              setTokenData({
                ...updatedTokens,
                lastPaymentDate: paymentDetails.latestPaymentDate,
                lastChargeAmount: paymentDetails.latestChargeAmount
              });
              setInvoices(invoiceList);
              setPaymentMethods(methods);
            }
          } else {
            setError('Payment was not completed successfully');
          }
        } catch (err) {
          console.error('Error handling checkout success:', err);
          setError(err instanceof Error ? err.message : 'Failed to process payment');
        } finally {
          setIsLoading(false);
          setIsHandlingCheckout(false);
        }
      }
    };

    handleCheckoutSuccess();
  }, [location.search, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Token Status and Purchase Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Token Status */}
        <div className={`bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
          tokenData?.tokens === 0 ? 'border-red-500' : 'border-blue-500'
        }`}>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Token Balance</h2>
            <div className="text-5xl font-bold mb-4">
              {tokenData ? tokenData.tokens : 0}
              <span className="text-lg text-gray-500 font-normal ml-2">tokens</span>
            </div>
            <p className="text-gray-600">
              {tokenData?.tokens === 0 
                ? 'You have no tokens remaining. Purchase tokens to continue using the AI assistant.'
                : 'Each second of conversation uses 1 token'}
            </p>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{TOKEN_PLAN.name}</h2>
            <div className="text-4xl font-bold mb-4">
              {TOKEN_PLAN.priceDisplay}
              <span className="text-lg text-gray-500 font-normal">
                / {TOKEN_PLAN.tokenAmount} tokens
              </span>
            </div>
            <div className="space-y-4 mb-8">
              {TOKEN_PLAN.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleTokenPurchase}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  Purchase Tokens
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {tokenData?.customerId && (
        <>
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
              <button
                onClick={() => setShowAddCard(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex-shrink-0 w-80 p-4 bg-gray-50 rounded-lg relative"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={CARD_BRAND_IMAGES[method.card.brand as keyof typeof CARD_BRAND_IMAGES]}
                      alt={`${method.card.brand} card`}
                      className="w-12 h-12"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} •••• {method.card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                      </p>
                    </div>
                  </div>
                  {!method.isDefault && (
                    <button
                      onClick={async () => {
                        try {
                          await updateCustomerDefaultPaymentMethod(tokenData.customerId, method.id);
                          const methods = await getCustomerPaymentMethods(tokenData.customerId);
                          setPaymentMethods(methods);
                        } catch (err) {
                          console.error('Error updating default payment method:', err);
                          setError(err instanceof Error ? err.message : 'Failed to update default payment method');
                        }
                      }}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Make Default
                    </button>
                  )}
                  {method.isDefault && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Purchase History</h3>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(invoice.amount_paid / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.receipt_url && (
                          <a
                            href={invoice.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Receipt
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showAddCard && (
        <AddCardModal
          customerId={tokenData.customerId}
          onClose={() => setShowAddCard(false)}
          onSuccess={async () => {
            const methods = await getCustomerPaymentMethods(tokenData.customerId);
            setPaymentMethods(methods);
            setShowAddCard(false);
          }}
        />
      )}
    </div>
  );
}