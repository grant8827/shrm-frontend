import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { apiClient } from '../services/apiClient';
import { useNotification } from '../contexts/NotificationContext';
import PayPalCheckout from '../components/PayPalCheckout';

interface Bill {
  id: number;
  patient: number;
  patient_name: string;
  title: string;
  description: string;
  amount: string;
  amount_paid: string;
  balance_remaining: string;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  payment_method: string;
  transaction_id: string;
  is_paid: boolean;
  is_overdue: boolean;
  created_at: string;
}

interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

// Shape returned by GET /api/billing/invoices (Prisma Invoice with nested relations)
interface InvoiceFromApi {
  id: string;
  patientId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  notes: string | null;
  patient?: { user?: { firstName?: string; lastName?: string } };
}

const toLocalBill = (inv: InvoiceFromApi): Bill => {
  const isPaid = inv.status === 'paid';
  const amountPaid = isPaid ? inv.total : 0;
  const balanceRemaining = inv.total - amountPaid;
  const isOverdue =
    !isPaid &&
    inv.status !== 'cancelled' &&
    !!inv.dueDate &&
    new Date(inv.dueDate) < new Date();
  const firstName = inv.patient?.user?.firstName ?? '';
  const lastName = inv.patient?.user?.lastName ?? '';
  return {
    id: inv.id as any,
    patient: inv.patientId as any,
    patient_name: `${firstName} ${lastName}`.trim(),
    title: inv.invoiceNumber,
    description: inv.notes ?? '',
    amount: String(inv.total),
    amount_paid: String(amountPaid),
    balance_remaining: String(balanceRemaining),
    status: inv.status,
    issue_date: inv.date,
    due_date: inv.dueDate ?? '',
    paid_date: inv.paymentDate,
    payment_method: inv.paymentMethod ?? '',
    transaction_id: inv.transactionId ?? '',
    is_paid: isPaid,
    is_overdue: isOverdue,
    created_at: inv.date,
  };
};

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

const PatientBillingInner: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payBill, setPayBill] = useState<Bill | null>(null);

  useEffect(() => {
    fetchBills();
    fetchSummary();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await apiClient.get('/api/billing/invoices');
      const raw: InvoiceFromApi[] = response.data?.results ?? response.data ?? [];
      setBills(Array.isArray(raw) ? raw.map(toLocalBill) : []);
    } catch (error) {
      showError('Failed to load bills');
      console.error('Error fetching bills:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/api/billing/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleOpenPayDialog = (bill: Bill) => {
    setPayBill(bill);
    setShowPayDialog(true);
  };

  const handleClosePayDialog = () => {
    setShowPayDialog(false);
    setPayBill(null);
  };

  const handlePayPalSuccess = async (transactionId: string) => {
    if (!payBill) return;
    try {
      await apiClient.post(`/api/billing/invoices/${payBill.id}/verify-paypal-payment`, {
        orderId: transactionId,
        amount: parseFloat(payBill.balance_remaining),
        paymentMethod: 'paypal',
      });
      showSuccess('Payment successful! Your bill has been updated.');
      handleClosePayDialog();
      fetchBills();
      fetchSummary();
    } catch (error: any) {
      showError(
        error.response?.data?.error ??
        error.response?.data?.detail ??
        'Payment verification failed. Please contact support.'
      );
    }
  };

  const handlePayPalError = (message: string) => {
    showError(message);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: string | number) => {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">My Billing</Typography>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Billed
                  </Typography>
                </Box>
                <Typography variant="h4">{formatCurrency(summary.totalBilled)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.invoiceCount} bills
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PaymentIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Paid
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(summary.totalPaid)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.paidCount} paid bills
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ReceiptIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Outstanding
                  </Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(summary.totalOutstanding)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.pendingCount} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Overdue
                  </Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(summary.totalOverdue)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {summary.overdueCount} bills
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Bills Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Bills
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No bills found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => (
                    <TableRow key={bill.id} hover>
                      <TableCell>{bill.title}</TableCell>
                      <TableCell>{formatCurrency(bill.amount)}</TableCell>
                      <TableCell>{formatCurrency(bill.amount_paid)}</TableCell>
                      <TableCell>
                        <Typography
                          color={parseFloat(bill.balance_remaining) > 0 ? 'error' : 'success'}
                          fontWeight="bold"
                        >
                          {formatCurrency(bill.balance_remaining)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bill.status.toUpperCase()}
                          color={getStatusColor(bill.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(bill.issue_date)}</TableCell>
                      <TableCell>
                        <Typography color={bill.is_overdue ? 'error' : 'inherit'}>
                          {formatDate(bill.due_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          title="View Details"
                          onClick={() => {
                            setSelectedBill(bill);
                            setShowDetails(true);
                          }}
                        >
                          <ReceiptIcon />
                        </IconButton>
                        {!bill.is_paid && bill.status !== 'cancelled' && parseFloat(bill.balance_remaining) > 0 && (
                          <IconButton
                            size="small"
                            title="Pay Now"
                            color="primary"
                            onClick={() => handleOpenPayDialog(bill)}
                          >
                            <PaymentIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bill Details</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedBill.title}</Typography>
                  <Chip
                    label={selectedBill.status.toUpperCase()}
                    color={getStatusColor(selectedBill.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                
                {selectedBill.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography>{selectedBill.description}</Typography>
                  </Grid>
                )}

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="h6">{formatCurrency(selectedBill.amount)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount Paid</Typography>
                  <Typography variant="h6">{formatCurrency(selectedBill.amount_paid)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Balance Remaining</Typography>
                  <Typography variant="h6" color="error">
                    {formatCurrency(selectedBill.balance_remaining)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Issue Date</Typography>
                  <Typography>{formatDate(selectedBill.issue_date)}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography color={selectedBill.is_overdue ? 'error' : 'inherit'}>
                    {formatDate(selectedBill.due_date)}
                  </Typography>
                </Grid>

                {selectedBill.paid_date && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Paid Date</Typography>
                    <Typography>{formatDate(selectedBill.paid_date)}</Typography>
                  </Grid>
                )}

                {selectedBill.payment_method && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                    <Typography>{selectedBill.payment_method}</Typography>
                  </Grid>
                )}

                {selectedBill.transaction_id && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                    <Typography>{selectedBill.transaction_id}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
          {selectedBill && !selectedBill.is_paid && selectedBill.status !== 'cancelled' && parseFloat(selectedBill.balance_remaining) > 0 && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => {
                setShowDetails(false);
                handleOpenPayDialog(selectedBill);
              }}
            >
              Pay Now
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Pay Now Dialog */}
      <Dialog open={showPayDialog} onClose={handleClosePayDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Pay Bill</DialogTitle>
        <DialogContent>
          {payBill && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>{payBill.title}</strong>
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Amount due: <strong>${parseFloat(payBill.balance_remaining).toFixed(2)}</strong>
              </Alert>
              <PayPalCheckout
                amount={payBill.balance_remaining}
                description={`Payment for ${payBill.title}`}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePayDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const PatientBilling: React.FC = () => (
  <PayPalScriptProvider
    options={{
      clientId: PAYPAL_CLIENT_ID ?? 'test',
      currency: 'USD',
      intent: 'capture',
      components: 'buttons',
    }}
  >
    <PatientBillingInner />
  </PayPalScriptProvider>
);

export default PatientBilling;
