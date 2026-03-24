import React from 'react';
import { PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { Box, Divider, Typography } from '@mui/material';

interface PayPalCheckoutProps {
  /** Dollar amount to charge, e.g. "125.00" */
  amount: string;
  currency?: string;
  /** Short description shown in the PayPal order */
  description?: string;
  /** Called with the PayPal transaction / order ID on successful capture */
  onSuccess: (transactionId: string) => void;
  /** Called with a human-readable error message on failure */
  onError: (message: string) => void;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({
  amount,
  currency = 'USD',
  description = 'Medical Bill Payment',
  onSuccess,
  onError,
}) => {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return (
      <Typography color="error" variant="body2">
        Please enter a valid payment amount above.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Secure Payment via PayPal
        </Typography>
      </Divider>

      {/* Credit / Debit card button */}
      <PayPalButtons
        fundingSource={FUNDING.CARD}
        style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
        createOrder={(_data, actions) =>
          actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: currency,
                  value: numericAmount.toFixed(2),
                },
                description,
              },
            ],
          })
        }
        onApprove={async (_data, actions) => {
          try {
            if (!actions.order) {
              onError('Payment capture failed — no order actions available.');
              return;
            }
            const details = await actions.order.capture();
            const txId = details.id ?? _data.orderID ?? 'paypal-payment';
            onSuccess(txId);
          } catch {
            onError('Payment capture failed. Please try again.');
          }
        }}
        onError={() => {
          onError('Payment was declined or an error occurred. Please try again.');
        }}
        onCancel={() => {
          onError('Payment was cancelled.');
        }}
      />

      {/* Also show PayPal wallet button as a secondary option */}
      <Box sx={{ mt: 1 }}>
        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
          createOrder={(_data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: currency,
                    value: numericAmount.toFixed(2),
                  },
                  description,
                },
              ],
            })
          }
          onApprove={async (_data, actions) => {
            try {
              if (!actions.order) {
                onError('Payment capture failed — no order actions available.');
                return;
              }
              const details = await actions.order.capture();
              const txId = details.id ?? _data.orderID ?? 'paypal-payment';
              onSuccess(txId);
            } catch {
              onError('Payment capture failed. Please try again.');
            }
          }}
          onError={() => {
            onError('Payment was declined or an error occurred. Please try again.');
          }}
          onCancel={() => {
            onError('Payment was cancelled.');
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
        Payments are processed securely by PayPal.
      </Typography>
    </Box>
  );
};

export default PayPalCheckout;
