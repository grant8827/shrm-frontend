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
  DialogContentText,
  DialogActions,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  type ChipProps,
  type SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  Refresh,
  EmailOutlined,
  PhoneOutlined,
  PersonAdd,
  MarkEmailUnread,
  DeleteOutline,
  RestoreFromTrash,
  Visibility,
} from '@mui/icons-material';
import {
  counselingRequestsService,
  type CounselingRequestFilters,
} from '../../services/counselingRequestsService';
import { CounselingRequest, LeadStatus } from '../../types';
import AddPatientForm, { type PatientFormData } from '../../components/AddPatientForm';
import { mapPatientFormDataToApiPayload, buildPatientFormDataFromCounselingRequest } from '../../utils/patientFormMapper';

const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'converted', 'closed'];

type ViewMode = 'active' | 'archived';

const getStatusColor = (status: string): ChipProps['color'] => {
  switch (status) {
    case 'new':
      return 'info';
    case 'contacted':
      return 'warning';
    case 'converted':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object') {
    const data = (err as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error) return data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const CounselingRequests: React.FC = () => {
  const [requests, setRequests] = useState<CounselingRequest[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  const [selected, setSelected] = useState<CounselingRequest | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // "Delete" (archive) confirmation
  const [archiveTarget, setArchiveTarget] = useState<CounselingRequest | null>(null);
  const [archiving, setArchiving] = useState(false);

  // "Send email requesting more info"
  const [infoTarget, setInfoTarget] = useState<CounselingRequest | null>(null);
  const [infoNote, setInfoNote] = useState('');
  const [sendingInfo, setSendingInfo] = useState(false);

  // "Add as Client" — opens the full intake form pre-filled from the request
  const [convertTarget, setConvertTarget] = useState<CounselingRequest | null>(null);
  const [converting, setConverting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: CounselingRequestFilters = { limit: 100 };
      if (search.trim()) filters.search = search.trim();
      if (statusFilter) filters.status = statusFilter;
      if (viewMode === 'archived') filters.includeArchived = 'only';

      const page = await counselingRequestsService.list(filters);
      setRequests(page.results || []);
      setCount(page.count || 0);
    } catch (err) {
      console.error('Failed to load counseling requests:', err);
      setError('Failed to load counseling requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, viewMode]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (event: SelectChangeEvent<string>) => {
    if (!selected) return;
    const newStatus = event.target.value as LeadStatus;
    setUpdatingStatus(true);
    try {
      const updated = await counselingRequestsService.updateStatus(selected.id, newStatus);
      setSelected(updated);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSuccessMessage('Status updated.');
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(getErrorMessage(err, 'Failed to update status. Please try again.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---- Delete (archive) ----
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await counselingRequestsService.archive(archiveTarget.id);
      setSuccessMessage('Counseling request deleted.');
      setArchiveTarget(null);
      if (selected?.id === archiveTarget.id) setSelected(null);
      await fetchRequests();
    } catch (err) {
      console.error('Failed to delete counseling request:', err);
      setError(getErrorMessage(err, 'Failed to delete. Please try again.'));
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (request: CounselingRequest) => {
    try {
      await counselingRequestsService.restore(request.id);
      setSuccessMessage('Counseling request restored.');
      await fetchRequests();
    } catch (err) {
      console.error('Failed to restore counseling request:', err);
      setError(getErrorMessage(err, 'Failed to restore. Please try again.'));
    }
  };

  // ---- Request more info ----
  const handleSendInfoRequest = async () => {
    if (!infoTarget) return;
    setSendingInfo(true);
    try {
      const result = await counselingRequestsService.requestMoreInfo(infoTarget.id, infoNote.trim() || undefined);
      setSuccessMessage(
        (result as unknown as { message?: string }).message || 'Email sent to applicant.'
      );
      setInfoTarget(null);
      setInfoNote('');
      await fetchRequests();
    } catch (err) {
      console.error('Failed to send info request email:', err);
      setError(getErrorMessage(err, 'Failed to send email. Please try again.'));
    } finally {
      setSendingInfo(false);
    }
  };

  // ---- Add as Client ----
  const handleConvertSubmit = async (formData: PatientFormData) => {
    if (!convertTarget) return;
    setConverting(true);
    try {
      const payload = mapPatientFormDataToApiPayload(formData);
      await counselingRequestsService.convertToClient(convertTarget.id, payload);
      setSuccessMessage('Client created successfully! Registration email has been sent.');
      await fetchRequests();
    } catch (err) {
      console.error('Failed to convert request to client:', err);
      setError(getErrorMessage(err, 'Failed to create client. Please try again.'));
    } finally {
      setConverting(false);
      setConvertTarget(null);
    }
  };

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
            Counseling Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Applicants who submitted the public Counseling Request Form
          </Typography>
        </Box>
        <IconButton onClick={fetchRequests} aria-label="Refresh">
          <Refresh />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
          >
            <MenuItem value="">All statuses</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="view-mode-label">View</InputLabel>
          <Select
            labelId="view-mode-label"
            label="View"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="archived">Deleted</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Service Type</TableCell>
                <TableCell>Preferred Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {viewMode === 'archived' ? 'No deleted requests.' : 'No counseling requests found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      {request.firstName} {request.lastName}
                      {request.isEmergency && (
                        <Chip label="Urgent" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{request.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {request.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.serviceType}</TableCell>
                    <TableCell>
                      {new Date(request.preferredDate).toLocaleDateString()} {request.preferredTime}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.convertedPatientId ? 'converted' : request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      {viewMode === 'archived' ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View application">
                            <IconButton size="small" onClick={() => setSelected(request)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restore">
                            <IconButton size="small" onClick={() => handleRestore(request)}>
                              <RestoreFromTrash fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View application">
                            <IconButton size="small" onClick={() => setSelected(request)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={request.convertedPatientId ? 'Already added as client' : 'Add as Client'}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!!request.convertedPatientId}
                                onClick={() => setConvertTarget(request)}
                              >
                                <PersonAdd fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Request more info">
                            <IconButton size="small" onClick={() => setInfoTarget(request)}>
                              <MarkEmailUnread fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setArchiveTarget(request)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
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
          {count} total request{count === 1 ? '' : 's'}
        </Typography>
      )}

      {/* Applicant detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              {selected.firstName} {selected.lastName}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    <EmailOutlined fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {selected.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">
                    <PhoneOutlined fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    {selected.phone}
                  </Typography>
                </Grid>
                {selected.dateOfBirth && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selected.dateOfBirth).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {selected.gender && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Gender
                    </Typography>
                    <Typography variant="body1">{selected.gender}</Typography>
                  </Grid>
                )}
                {(selected.street || selected.city || selected.state || selected.zipCode) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {[selected.street, selected.city, [selected.state, selected.zipCode].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Service Type
                  </Typography>
                  <Typography variant="body1">{selected.serviceType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Preferred Date / Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selected.preferredDate).toLocaleDateString()} at {selected.preferredTime}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Session Type
                  </Typography>
                  <Typography variant="body1">{selected.sessionType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Emergency Request
                  </Typography>
                  <Typography variant="body1">{selected.isEmergency ? 'Yes' : 'No'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Reason for Counseling
                  </Typography>
                  <Typography variant="body1">{selected.reasonForCounseling}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Previous Counseling
                  </Typography>
                  <Typography variant="body1">{selected.previousCounseling ? 'Yes' : 'No'}</Typography>
                </Grid>
                {selected.medications && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Medications
                    </Typography>
                    <Typography variant="body1">{selected.medications}</Typography>
                  </Grid>
                )}
                {selected.additionalInfo && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Additional Info
                    </Typography>
                    <Typography variant="body1">{selected.additionalInfo}</Typography>
                  </Grid>
                )}

                {selected.hasInsurance && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Insurance</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Provider
                      </Typography>
                      <Typography variant="body1">{selected.insuranceProvider || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Policy Number
                      </Typography>
                      <Typography variant="body1">{selected.policyNumber || '—'}</Typography>
                    </Grid>
                  </>
                )}

                {(selected.emergencyContactName || selected.emergencyContactPhone) && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Emergency Contact</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{selected.emergencyContactName || '—'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{selected.emergencyContactPhone || '—'}</Typography>
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selected.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth disabled={updatingStatus}>
                    <InputLabel id="detail-status-label">Status</InputLabel>
                    <Select
                      labelId="detail-status-label"
                      label="Status"
                      value={selected.status}
                      onChange={handleStatusChange}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                startIcon={<PersonAdd />}
                disabled={!!selected.convertedPatientId}
                onClick={() => setConvertTarget(selected)}
              >
                {selected.convertedPatientId ? 'Already a client' : 'Add as Client'}
              </Button>
              <Button startIcon={<MarkEmailUnread />} onClick={() => setInfoTarget(selected)}>
                Request Info
              </Button>
              <Button color="error" startIcon={<DeleteOutline />} onClick={() => setArchiveTarget(selected)}>
                Delete
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button onClick={() => setSelected(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete counseling request?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {archiveTarget && (
              <>
                This removes {archiveTarget.firstName} {archiveTarget.lastName} from the active list. It
                isn't permanently erased — you can restore it from the "Deleted" view.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveTarget(null)} disabled={archiving}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmArchive} disabled={archiving}>
            {archiving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request more info */}
      <Dialog open={!!infoTarget} onClose={() => setInfoTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Request more information</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {infoTarget && (
              <>
                Sends a standard "we need more information" email to {infoTarget.email}. You can add a
                note below with specifics about what's missing.
              </>
            )}
          </DialogContentText>
          <TextField
            label="Note (optional)"
            multiline
            minRows={3}
            fullWidth
            value={infoNote}
            onChange={(e) => setInfoNote(e.target.value)}
            placeholder="e.g. Could you confirm your insurance member ID?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInfoTarget(null); setInfoNote(''); }} disabled={sendingInfo}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSendInfoRequest} disabled={sendingInfo}>
            {sendingInfo ? 'Sending…' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add as Client — full intake form, pre-filled from the request */}
      {convertTarget && (
        <AddPatientForm
          key={convertTarget.id}
          open={!!convertTarget}
          onClose={() => setConvertTarget(null)}
          onSubmit={handleConvertSubmit}
          initialData={buildPatientFormDataFromCounselingRequest(convertTarget)}
          title="Add as Client"
          submitLabel="Create Client"
        />
      )}
      {converting && (
        <Snackbar open message="Creating client…" />
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default CounselingRequests;
