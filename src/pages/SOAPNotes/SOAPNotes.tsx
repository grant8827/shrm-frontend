import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Assignment,
  Schedule,
  Save,
  Cancel
} from '@mui/icons-material';

// Mock data for SOAP notes
const mockSOAPNotes = [
  {
    id: 1,
    patientName: 'John Doe',
    date: '2025-11-03',
    sessionType: 'Individual Therapy',
    status: 'completed',
    lastModified: '2025-11-03 10:30 AM'
  },
  {
    id: 2,
    patientName: 'Jane Smith',
    date: '2025-11-03',
    sessionType: 'Initial Assessment',
    status: 'draft',
    lastModified: '2025-11-03 11:45 AM'
  },
  {
    id: 3,
    patientName: 'Mike Johnson',
    date: '2025-11-02',
    sessionType: 'Group Therapy',
    status: 'pending',
    lastModified: '2025-11-02 4:15 PM'
  }
];

const SOAPNotes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  const handleOpenDialog = (note: any = null) => {
    setSelectedNote(note);
    if (note) {
      setSoapData({
        subjective: note.subjective || '',
        objective: note.objective || '',
        assessment: note.assessment || '',
        plan: note.plan || ''
      });
    } else {
      setSoapData({ subjective: '', objective: '', assessment: '', plan: '' });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedNote(null);
  };

  const handleSave = () => {
    // Save logic would go here
    console.log('Saving SOAP note:', soapData);
    handleCloseDialog();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'draft': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          SOAP Notes & Clinical Documentation
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New SOAP Note
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed This Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Edit color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                3
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Draft Notes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">
                2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue Notes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SOAP Notes Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Session Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockSOAPNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>{note.date}</TableCell>
                  <TableCell>{note.patientName}</TableCell>
                  <TableCell>{note.sessionType}</TableCell>
                  <TableCell>
                    <Chip
                      label={note.status}
                      color={getStatusColor(note.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{note.lastModified}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(note)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="info">
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* SOAP Note Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNote ? 'Edit SOAP Note' : 'New SOAP Note'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Subjective
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Patient's reported symptoms, concerns, and subjective experience..."
                  value={soapData.subjective}
                  onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Objective
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Observable findings, test results, mental status exam..."
                  value={soapData.objective}
                  onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Assessment
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Clinical impression, diagnosis, progress assessment..."
                  value={soapData.assessment}
                  onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom color="primary">
                  Plan
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Treatment plan, interventions, follow-up, homework assignments..."
                  value={soapData.plan}
                  onChange={(e) => setSoapData({ ...soapData, plan: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SOAPNotes;