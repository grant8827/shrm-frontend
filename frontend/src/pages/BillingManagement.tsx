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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  useTheme,
  useMediaQuery,
  type ChipProps,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { useNotification } from '../contexts/NotificationContext';

// Matches the transformed invoice shape returned by the backend
interface Bill {
  id: string;
  patient: string;          // patientId
  patient_name: string;
  title: string;            // invoice_number for display
  description: string;      // from notes
  amount: string;           // total
  amount_paid: string;
  balance_remaining: string;
  status: string;
  issue_date: string;       // date
  due_date: string;         // dueDate
  paid_date: string | null;
  payment_method: string;
  is_paid: boolean;
  is_overdue: boolean;
  created_at: string;
}

// Matches what /api/patients/ returns via toSnakePatient transformer
interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

// Transform backend invoice (camelCase) to Bill (snake_case for display)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformInvoice = (inv: any): Bill => {
  const patientUser = inv.patient?.user;
  const patientName = patientUser
    ? `${patientUser.firstName ?? ''} ${patientUser.lastName ?? ''}`.trim()
    : (inv.patient?.first_name ? `${inv.patient.first_name} ${inv.patient.last_name}`.trim() : 'Unknown Patient');

  const total = parseFloat(inv.total ?? inv.amount ?? '0');
  const isPaid = inv.status === 'paid';
  const amountPaid = isPaid ? total : 0;
  const balanceRemaining = isPaid ? 0 : total;

  const dueDate: string = inv.dueDate ?? inv.due_date ?? '';
  const isOverdue =
    !isPaid &&
    inv.status !== 'cancelled' &&
    dueDate !== '' &&
    new Date(dueDate) < new Date();

  return {
    id: inv.id,
    patient: inv.patientId ?? inv.patient ?? '',
    patient_name: patientName,
    title: inv.invoiceNumber ?? inv.invoice_number ?? `INV-${(inv.id ?? '').slice(0, 6)}`,
    description: inv.notes ?? '',
    amount: total.toFixed(2),
    amount_paid: amountPaid.toFixed(2),
    balance_remaining: balanceRemaining.toFixed(2),
    status: inv.status ?? 'pending',
    issue_date: inv.date ? inv.date.split('T')[0] : (inv.issue_date ?? ''),
    due_date: dueDate ? dueDate.split('T')[0] : '',
    paid_date: inv.paymentDate ? inv.paymentDate.split('T')[0] : null,
    payment_method: inv.paymentMethod ?? '',
    is_paid: isPaid,
    is_overdue: isOverdue,
    created_at: inv.createdAt ?? inv.created_at ?? '',
  };
};

interface BillingFormData {
  patient: string;      // Patient.id (patientId)
  title: string;        // maps to invoiceNumber
  description: string;  // maps to notes
  amount: string;       // maps to total
  issue_date: string;   // maps to date
  due_date: string;     // maps to dueDate
}

interface PaymentFormData {
  amount: string;
  payment_method: string; // maps to paymentMethod
  transaction_id: string;
}

const BillingManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  
  const [formData, setFormData] = useState<BillingFormData>({
    patient: '',
    title: '',
    description: '',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    amount: '',
    payment_method: '',
    transaction_id: '',
  });

  useEffect(() => {
    fetchBills();
    fetchPatients();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await apiClient.get('/api/billing/invoices');
      const raw = response.data?.results ?? response.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setBills(list.map(transformInvoice));
    } catch (error) {
      showError('Failed to load bills');
      console.error('Error fetching bills:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/api/patients/');
      const list = response.data?.results ?? response.data ?? [];
      const active = Array.isArray(list)
        ? list.filter((p: Patient) => p.status === 'active')
        : [];
      setPatients(active);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showError('Failed to load patients');
    }
  };

  const handleOpenDialog = (bill?: Bill) => {
    if (bill) {
      setEditMode(true);
      setSelectedBill(bill);
      setFormData({
        patient: bill.patient,
        title: bill.title,
        description: bill.description,
        amount: bill.amount,
        issue_date: bill.issue_date,
        due_date: bill.due_date,
      });
    } else {
      setEditMode(false);
      setSelectedBill(null);
      setFormData({
        patient: '',
        title: '',
        description: '',
        amount: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedBill(null);
  };

  const handleSubmit = async () => {
    try {
      // Map form fields to what the backend createInvoice / updateInvoice expects
      const payload = {
        patientId: formData.patient,
        total: parseFloat(formData.amount),
        subtotal: parseFloat(formData.amount),
        notes: formData.description || formData.title || undefined,
        date: formData.issue_date,
        dueDate: formData.due_date,
        invoiceNumber: formData.title || undefined,
      };

      if (editMode && selectedBill) {
        await apiClient.patch(`/api/billing/invoices/${selectedBill.id}`, payload);
        showSuccess('Bill updated successfully');
      } else {
        await apiClient.post('/api/billing/invoices', payload);
        showSuccess('Bill created successfully');
      }
      handleCloseDialog();
      fetchBills();
    } catch (error: any) {
      showError(error.response?.data?.error ?? error.response?.data?.detail ?? 'Failed to save bill');
      console.error('Error saving bill:', error);
    }
  };

  const handleDelete = async (billId: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    try {
      await apiClient.delete(`/api/billing/invoices/${billId}`);
      showSuccess('Bill deleted successfully');
      fetchBills();
    } catch (error: any) {
      showError(error.response?.data?.error ?? error.response?.data?.detail ?? 'Failed to delete bill');
      console.error('Error deleting bill:', error);
    }
  };

  const handleOpenPaymentDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.balance_remaining,
      payment_method: '',
      transaction_id: '',
    });
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedBill(null);
  };

  const handleAddPayment = async () => {
    if (!selectedBill) return;

    try {
      // Backend addPayment expects: { amount, paymentMethod }
      await apiClient.post(`/api/billing/invoices/${selectedBill.id}/payment`, {
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.payment_method,
      });
      showSuccess('Payment recorded successfully');
      handleClosePaymentDialog();
      fetchBills();
    } catch (error: any) {
      showError(error.response?.data?.error ?? error.response?.data?.detail ?? 'Failed to record payment');
      console.error('Error recording payment:', error);
    }
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
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
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}>
        <Typography variant="h4">Billing Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
        >
          Create Bill
        </Button>
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {bills.length === 0 ? (
            <Card>
              <CardContent>
                <Typography color="text.secondary" textAlign="center">No bills found</Typography>
              </CardContent>
            </Card>
          ) : (
            bills.map((bill) => (
              <Card key={bill.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1">{bill.patient_name}</Typography>
                      <Typography variant="body2" color="text.secondary">{bill.title}</Typography>
                    </Box>
                    <Chip label={bill.status.toUpperCase()} color={getStatusColor(bill.status)} size="small" />
                  </Box>

                  <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(bill.amount)}</Typography>
                  <Typography variant="body2"><strong>Paid:</strong> {formatCurrency(bill.amount_paid)}</Typography>
                  <Typography variant="body2" color={parseFloat(bill.balance_remaining) > 0 ? 'error.main' : 'success.main'}>
                    <strong>Balance:</strong> {formatCurrency(bill.balance_remaining)}
                  </Typography>
                  <Typography variant="body2" color={bill.is_overdue ? 'error.main' : 'text.primary'}>
                    <strong>Due:</strong> {formatDate(bill.due_date)}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <IconButton size="small" onClick={() => handleOpenDialog(bill)} title="Edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenPaymentDialog(bill)}
                      title="Add Payment"
                      disabled={bill.status === 'paid' || bill.status === 'cancelled'}
                    >
                      <PaymentIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(bill.id)} title="Delete" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Status</TableCell>
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
                        <TableCell>{bill.patient_name}</TableCell>
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
                            color={getStatusColor(bill.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography color={bill.is_overdue ? 'error' : 'inherit'}>
                            {formatDate(bill.due_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(bill)}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPaymentDialog(bill)}
                            title="Add Payment"
                            disabled={bill.status === 'paid' || bill.status === 'cancelled'}
                          >
                            <PaymentIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(bill.id)}
                            title="Delete"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Bill Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Bill' : 'Create New Bill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    value={formData.patient}
                    onChange={(e) => setFormData({ ...formData, patient: e.target.value as string })}
                    label="Patient"
                  >
                    <MenuItem value="">Select a patient</MenuItem>
                    {patients.length === 0 ? (
                      <MenuItem disabled>No active patients found</MenuItem>
                    ) : (
                      patients.map((patient) => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {`${patient.first_name} ${patient.last_name}`.trim()} ({patient.email})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Issue Date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.patient || !formData.title || !formData.amount || !formData.due_date}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Payment
          {selectedBill && (
            <Typography variant="subtitle2" color="text.secondary">
              Bill: {selectedBill.title} - Balance: {formatCurrency(selectedBill.balance_remaining)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    label="Payment Method"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="debit_card">Debit Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="insurance">Insurance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Transaction ID (Optional)"
                  value={paymentData.transaction_id}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_id: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            onClick={handleAddPayment}
            variant="contained"
            disabled={!paymentData.amount || !paymentData.payment_method}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingManagement;
