import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search, Refresh, Visibility, CheckCircleOutline, CancelOutlined } from '@mui/icons-material';
import {
  clientConsentsService,
  type ClientConsentListItem,
  type ClientConsentDetail,
} from '../../services/clientConsentsService';

// Staff/Admin/Therapist-facing search over signed consent records submitted
// through the public onboarding wizard (SEC-1042, /consent-forms).
// This is the "search for a client, find their signed documents" workflow.
const ClientConsents: React.FC = () => {
  const [records, setRecords] = useState<ClientConsentListItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<ClientConsentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await clientConsentsService.list({ limit: 100, search: search.trim() || undefined });
      setRecords(page.results || []);
      setCount(page.count || 0);
    } catch (err) {
      console.error('Failed to load client consents:', err);
      setError('Failed to load signed documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleView = async (record: ClientConsentListItem) => {
    setLoadingDetail(true);
    try {
      const detail = await clientConsentsService.getById(record.id);
      setSelected(detail);
    } catch (err) {
      console.error('Failed to load consent record:', err);
      setError('Failed to load this document. Please try again.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderConsentChip = (accepted: boolean, label: string) => (
    <Chip
      key={label}
      size="small"
      icon={accepted ? <CheckCircleOutline /> : <CancelOutlined />}
      label={label}
      color={accepted ? 'success' : 'default'}
      variant={accepted ? 'filled' : 'outlined'}
      sx={{ mr: 0.5, mb: 0.5 }}
    />
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Client Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Signed consent forms submitted through the client onboarding portal
          </Typography>
        </Box>
        <IconButton onClick={fetchRecords} aria-label="Refresh">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by client name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Documents Signed</TableCell>
                <TableCell>Signed On</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {search ? 'No matching signed documents found.' : 'No signed documents yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{record.fullName}</TableCell>
                    <TableCell>{record.email}</TableCell>
                    <TableCell>
                      {renderConsentChip(record.privacyPolicyAccepted, 'Privacy')}
                      {renderConsentChip(record.treatmentAgreementAccepted, 'Treatment')}
                      {renderConsentChip(record.hipaaAuthorizationAccepted, 'HIPAA')}
                    </TableCell>
                    <TableCell>{new Date(record.signedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View signed document">
                        <IconButton size="small" onClick={() => handleView(record)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {count} total signed document{count === 1 ? '' : 's'}
        </Typography>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected || loadingDetail} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.fullName || 'Loading...'}</DialogTitle>
        <DialogContent dividers>
          {loadingDetail && !selected ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : selected ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selected.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Signed On</Typography>
                <Typography variant="body1">{new Date(selected.signedAt).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">IP Address</Typography>
                <Typography variant="body1">{selected.ipAddress || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Linked Client Record</Typography>
                <Typography variant="body1">{selected.patientId ? 'Matched to existing client' : 'Not linked'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Consents Acknowledged</Typography>
                {renderConsentChip(selected.privacyPolicyAccepted, 'Privacy Policy')}
                {renderConsentChip(selected.treatmentAgreementAccepted, 'Treatment Agreement')}
                {renderConsentChip(selected.hipaaAuthorizationAccepted, 'HIPAA Authorization')}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                  Electronic Signature
                </Typography>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: 'white' }}>
                  <img
                    src={selected.signatureImage}
                    alt={`Signature of ${selected.fullName}`}
                    style={{ maxWidth: '100%', maxHeight: 160 }}
                  />
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClientConsents;
