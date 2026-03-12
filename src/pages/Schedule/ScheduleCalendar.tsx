import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  Refresh,
  EventAvailable,
  EventBusy,
  Block,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Therapist {
  id: string;
  full_name: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

// slot value: "0" = unavailable, "1" = available, "2" = booked
type SlotValue = '0' | '1' | '2';

interface SlotGrid {
  [date: string]: { [slot: string]: SlotValue };
}

interface AvailabilityResponse {
  therapist_id: string;
  grid: SlotGrid;
  slot_times: string[];
  slot_labels: { [slot: string]: string };
}

interface BookingForm {
  patientId: string;
  type: 'initial' | 'follow-up' | 'group' | 'assessment' | 'emergency';
  notes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = [
  { value: 'initial', label: 'Initial Evaluation' },
  { value: 'follow-up', label: 'Follow-Up' },
  { value: 'group', label: 'Group Session' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'emergency', label: 'Emergency' },
] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Return the Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a Date as YYYY-MM-DD */
function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Format date range label, e.g. "Apr 28 – May 4, 2025" */
function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = monday.toLocaleDateString('en-US', opts);
  const end = sunday.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
}

/** Return true if the given ISO date (YYYY-MM-DD) is strictly before today */
function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleCalendar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useNotification();

  const userRole = authState.user?.role ?? '';
  const userId = authState.user?.id ?? '';
  const isAdminOrStaff = userRole === 'admin' || userRole === 'staff';
  const isTherapist = userRole === 'therapist';

  // ── State ──────────────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(
    isTherapist ? userId : ''
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Booking dialog
  const [bookingTarget, setBookingTarget] = useState<{ date: string; slot: string } | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    patientId: '',
    type: 'follow-up',
    notes: '',
  });
  const [booking, setBooking] = useState(false);

  // Toggle confirmation (therapist mode)
  const [toggling, setToggling] = useState<string | null>(null); // "date|slot" key

  // ── Derived ────────────────────────────────────────────────────────────────
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toISO(d);
  });

  const startDate = weekDates[0];
  const endDate = weekDates[6];

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchTherapists = useCallback(async () => {
    if (!isAdminOrStaff) return;
    try {
      const res = await apiClient.get('/api/schedule/therapists');
      const list: Therapist[] = Array.isArray(res.data) ? res.data : [];
      setTherapists(list);
      if (list.length > 0 && !selectedTherapistId) {
        setSelectedTherapistId(list[0].id);
      }
    } catch {
      showError('Failed to load therapists');
    }
  }, [isAdminOrStaff, selectedTherapistId, showError]);

  const fetchPatients = useCallback(async () => {
    if (!isAdminOrStaff) return;
    try {
      const res = await apiClient.get('/api/patients/');
      const raw = res.data?.results ?? res.data ?? [];
      const active = Array.isArray(raw)
        ? raw.filter((p: Patient) => p.status === 'active')
        : [];
      setPatients(active);
    } catch {
      // non-critical
    }
  }, [isAdminOrStaff]);

  const fetchAvailability = useCallback(async () => {
    if (!selectedTherapistId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/api/schedule/${selectedTherapistId}?startDate=${startDate}&endDate=${endDate}`
      );
      setAvailability(res.data as AvailabilityResponse);
    } catch {
      showError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [selectedTherapistId, startDate, endDate, showError]);

  useEffect(() => {
    fetchTherapists();
    fetchPatients();
  }, [fetchTherapists, fetchPatients]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // ── Slot colour helpers ────────────────────────────────────────────────────
  const slotStyle = (value: SlotValue, isPast: boolean) => {
    if (isPast) {
      return {
        bgcolor: theme.palette.grey[100],
        color: theme.palette.grey[400],
        border: `1px solid ${theme.palette.grey[200]}`,
        cursor: 'default',
      };
    }
    switch (value) {
      case '1':
        return {
          bgcolor: '#e3f2fd',
          color: '#1565c0',
          border: '1px solid #90caf9',
          cursor: isAdminOrStaff ? 'pointer' : 'default',
        };
      case '2':
        return {
          bgcolor: '#1976d2',
          color: '#fff',
          border: '1px solid #1565c0',
          cursor: 'default',
        };
      default:
        return {
          bgcolor: theme.palette.grey[200],
          color: theme.palette.grey[500],
          border: `1px solid ${theme.palette.grey[300]}`,
          cursor: isTherapist ? 'pointer' : 'default',
        };
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleOpenBooking = (date: string, slot: string) => {
    setBookingTarget({ date, slot });
    setBookingForm({ patientId: '', type: 'follow-up', notes: '' });
  };

  const handleCloseBooking = () => {
    setBookingTarget(null);
  };

  const handleBook = async () => {
    if (!bookingTarget || !bookingForm.patientId) return;
    setBooking(true);
    try {
      await apiClient.post('/api/schedule/book', {
        therapistId: selectedTherapistId,
        date: bookingTarget.date,
        slot: bookingTarget.slot,
        patientId: bookingForm.patientId,
        type: bookingForm.type,
        notes: bookingForm.notes || undefined,
      });
      showSuccess('Appointment booked successfully!');
      handleCloseBooking();
      fetchAvailability();
    } catch (err: any) {
      showError(err.response?.data?.error ?? 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const handleToggleSlot = async (date: string, slot: string) => {
    const key = `${date}|${slot}`;
    setToggling(key);
    try {
      await apiClient.post('/api/schedule/toggle', {
        therapistId: selectedTherapistId,
        date,
        slot,
      });
      fetchAvailability();
    } catch (err: any) {
      showError(err.response?.data?.error ?? 'Failed to update slot');
    } finally {
      setToggling(null);
    }
  };

  // ── Slot click handler ─────────────────────────────────────────────────────
  const handleSlotClick = (date: string, slot: string, value: SlotValue) => {
    if (isPastDate(date)) return;
    if (isAdminOrStaff && value === '1') {
      handleOpenBooking(date, slot);
    } else if (isTherapist && (value === '0' || value === '1')) {
      handleToggleSlot(date, slot);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const slotTimes = availability?.slot_times ?? [];
  const slotLabels = availability?.slot_labels ?? {};
  const grid = availability?.grid ?? {};

  const selectedTherapistName =
    therapists.find((t) => t.id === selectedTherapistId)?.full_name ??
    (isTherapist
      ? `${authState.user?.firstName ?? ''} ${authState.user?.lastName ?? ''}`.trim()
      : '');

  return (
    <Box p={isMobile ? 2 : 3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h5" fontWeight={700} color="primary">
          Appointment Schedule
        </Typography>

        {/* Legend */}
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            size="small"
            icon={<EventAvailable sx={{ fontSize: 16 }} />}
            label="Available"
            sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 500 }}
          />
          <Chip
            size="small"
            icon={<EventBusy sx={{ fontSize: 16 }} />}
            label="Booked"
            sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 500 }}
          />
          <Chip
            size="small"
            icon={<Block sx={{ fontSize: 16 }} />}
            label="Unavailable"
            sx={{ bgcolor: 'grey.300', color: 'grey.600', fontWeight: 500 }}
          />
        </Box>
      </Box>

      {/* Controls row */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {/* Week navigation */}
          <Box display="flex" alignItems="center" gap={0.5}>
            <IconButton onClick={handlePrevWeek} size="small">
              <NavigateBefore />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600} minWidth={180} textAlign="center">
              {formatWeekLabel(weekStart)}
            </Typography>
            <IconButton onClick={handleNextWeek} size="small">
              <NavigateNext />
            </IconButton>
          </Box>

          {/* Therapist selector (admin/staff only) */}
          {isAdminOrStaff && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Therapist</InputLabel>
              <Select
                value={selectedTherapistId}
                label="Therapist"
                onChange={(e) => setSelectedTherapistId(e.target.value)}
              >
                {therapists.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isTherapist && selectedTherapistName && (
            <Typography variant="body2" color="text.secondary">
              Viewing: <strong>{selectedTherapistName}</strong>
              {' '}— click available/unavailable slots to toggle your schedule
            </Typography>
          )}

          <Box flex={1} />

          <Tooltip title="Refresh">
            <IconButton onClick={fetchAvailability} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Grid */}
      <Paper elevation={2} sx={{ overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : !selectedTherapistId ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">Select a therapist to view the schedule.</Typography>
          </Box>
        ) : (
          <Box sx={{ minWidth: 700 }}>
            {/* Column headers */}
            <Box
              display="grid"
              gridTemplateColumns={`80px repeat(7, 1fr)`}
              sx={{ bgcolor: theme.palette.primary.main, color: '#fff' }}
            >
              <Box p={1} />
              {weekDates.map((date) => {
                const d = new Date(date + 'T12:00:00');
                const today = toISO(new Date());
                const isToday = date === today;
                return (
                  <Box
                    key={date}
                    p={1}
                    textAlign="center"
                    sx={{
                      bgcolor: isToday ? theme.palette.primary.dark : undefined,
                      borderLeft: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                      {DAY_NAMES[d.getDay()]}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {d.getDate()}
                    </Typography>
                    {isToday && (
                      <Typography variant="caption" sx={{ fontSize: 9, opacity: 0.9 }}>
                        TODAY
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Time rows */}
            {slotTimes.map((slot) => (
              <Box
                key={slot}
                display="grid"
                gridTemplateColumns={`80px repeat(7, 1fr)`}
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
              >
                {/* Time label */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-end"
                  pr={1}
                  sx={{
                    bgcolor: theme.palette.grey[50],
                    borderRight: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {slotLabels[slot] ?? slot}
                  </Typography>
                </Box>

                {/* Day cells */}
                {weekDates.map((date) => {
                  const cellKey = `${date}|${slot}`;
                  const value: SlotValue = (grid[date]?.[slot] ?? '0') as SlotValue;
                  const past = isPastDate(date);
                  const styles = slotStyle(value, past);
                  const isTogglingThis = toggling === cellKey;

                  let tooltipTitle = '';
                  if (past) tooltipTitle = 'Past date';
                  else if (value === '2') tooltipTitle = 'Booked';
                  else if (value === '1' && isAdminOrStaff) tooltipTitle = 'Click to book';
                  else if (value === '0' && isTherapist) tooltipTitle = 'Click to mark available';
                  else if (value === '1' && isTherapist) tooltipTitle = 'Click to mark unavailable';

                  return (
                    <Tooltip key={date} title={tooltipTitle} placement="top" arrow>
                      <Box
                        onClick={() => !isTogglingThis && handleSlotClick(date, slot, value)}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                          ...styles,
                          minHeight: 36,
                          transition: 'background-color 0.15s',
                          borderLeft: `1px solid ${theme.palette.divider}`,
                          '&:hover':
                            !past && (
                              (isAdminOrStaff && value === '1') ||
                              (isTherapist && (value === '0' || value === '1'))
                            )
                              ? { filter: 'brightness(0.92)' }
                              : {},
                        }}
                      >
                        {isTogglingThis ? (
                          <CircularProgress size={14} />
                        ) : value === '1' && !past && isAdminOrStaff ? (
                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              fontSize: 10,
                              py: 0.2,
                              px: 1,
                              minWidth: 0,
                              bgcolor: '#1976d2',
                              '&:hover': { bgcolor: '#1565c0' },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBooking(date, slot);
                            }}
                          >
                            Book
                          </Button>
                        ) : value === '2' ? (
                          <Typography variant="caption" fontWeight={600} fontSize={10}>
                            Booked
                          </Typography>
                        ) : value === '1' && !past && isTherapist ? (
                          <Typography variant="caption" fontWeight={600} fontSize={10} sx={{ color: '#1565c0' }}>
                            Available
                          </Typography>
                        ) : null}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Booking Dialog */}
      <Dialog open={!!bookingTarget} onClose={handleCloseBooking} maxWidth="sm" fullWidth>
        <DialogTitle>
          Book Appointment
          {bookingTarget && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {slotLabels[bookingTarget.slot] ?? bookingTarget.slot} on&nbsp;
              {new Date(bookingTarget.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              {selectedTherapistName && ` with ${selectedTherapistName}`}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
            {/* Patient */}
            <FormControl fullWidth required>
              <InputLabel>Patient</InputLabel>
              <Select
                value={bookingForm.patientId}
                label="Patient"
                onChange={(e) => setBookingForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                {patients.length === 0 && (
                  <MenuItem value="" disabled>
                    No active patients found
                  </MenuItem>
                )}
                {patients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Appointment type */}
            <FormControl fullWidth required>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                value={bookingForm.type}
                label="Appointment Type"
                onChange={(e) =>
                  setBookingForm((f) => ({
                    ...f,
                    type: e.target.value as BookingForm['type'],
                  }))
                }
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Notes */}
            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              fullWidth
              value={bookingForm.notes}
              onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any relevant notes for this appointment..."
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseBooking} disabled={booking}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBook}
            disabled={booking || !bookingForm.patientId}
            startIcon={booking ? <CircularProgress size={16} /> : undefined}
          >
            {booking ? 'Booking…' : 'Book Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
