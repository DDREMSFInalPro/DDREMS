import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:   { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
    text: { primary: '#1a1a2e', secondary: '#6b7280' },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  shape: { borderRadius: 10 },

  components: {
    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 18px',
          transition: 'all 0.18s ease',
        },
        contained: {
          '&:hover': { filter: 'brightness(0.92)', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
          '&:active': { transform: 'translateY(0)' },
        },
      },
    },

    // ── Card ────────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e8eaf0',
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease',
        },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: { paddingBottom: 12 },
        title: { fontWeight: 600, fontSize: '0.95rem' },
      },
    },

    // ── Paper ───────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation2: { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
        elevation3: { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        elevation12: { boxShadow: '0 12px 40px rgba(0,0,0,0.14)' },
      },
    },

    // ── TextField ───────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.18s',
            '&:hover fieldset': { borderColor: '#1976d2' },
            '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(25,118,210,0.12)' },
          },
        },
      },
    },

    // ── Select ──────────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
          '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(25,118,210,0.12)' },
        },
      },
    },

    // ── Table ───────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            color: '#374151',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #e8eaf0',
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f8fafc' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#f0f2f5', padding: '12px 16px' },
      },
    },

    // ── Chip ────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' },
        colorWarning:  { backgroundColor: '#fff3e0', color: '#e65100' },
        colorSuccess:  { backgroundColor: '#e8f5e9', color: '#1b5e20' },
        colorError:    { backgroundColor: '#fce4ec', color: '#880e4f' },
        colorInfo:     { backgroundColor: '#e3f2fd', color: '#0d47a1' },
      },
    },

    // ── AppBar ──────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 8px rgba(0,0,0,0.15)' },
      },
    },

    // ── Drawer ──────────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid #e8eaf0', boxShadow: 'none' },
      },
    },

    // ── Dialog ──────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.1rem', paddingBottom: 8 },
      },
    },

    // ── Alert ───────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    // ── Skeleton ────────────────────────────────────────────────────────────
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },

    // ── ListItemButton ──────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
          transition: 'background-color 0.15s, color 0.15s',
        },
      },
    },

    // ── Divider ─────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#e8eaf0' },
      },
    },
  },
});

export default theme;
