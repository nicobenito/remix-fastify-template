import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, styled, ThemeProvider, useThemeProps } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { forwardRef } from 'react';

const theme = createTheme();

theme.typography.h3 = {
  fontSize: '1.2rem',
  '@media (min-width:600px)': {
    fontSize: '1.5rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '2rem',
  },
};

export interface StatProps {
  color?: string;
  value: number | string;
  title?: string;
  unit: string;
  variant?: 'outlined';
}

interface StatOwnerState extends StatProps {}

const StatRoot = styled('div', {
  name: 'MuiStat',
  slot: 'root',
})<{ ownerState: StatOwnerState }>(({ theme, ownerState }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  letterSpacing: '-0.025em',
  fontWeight: 600,
  ...(ownerState.variant === 'outlined' && {
    border: `2px solid ${theme.palette.divider}`,
    boxShadow: 'none',
  }),
  width: 200,
  overflow: 'hidden',
}));

const StatValue = styled('div', {
  name: 'MuiStat',
  slot: 'value',
})<{ ownerState: StatOwnerState }>(({ theme, ownerState }) => ({
  ...theme.typography.h3,
  color: ownerState.color ?? theme.palette.text.primary,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

const StatUnit = styled('div', {
  name: 'MuiStat',
  slot: 'unit',
})<{ ownerState: StatOwnerState }>(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  textAlign: 'center',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
}));

export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat(inProps, ref) {
  const props = useThemeProps({ props: inProps, name: 'MuiStat' });
  const { value, unit, color, variant, title, ...other } = props;

  const ownerState = { ...props, color, variant };
  const Component = (
    <StatRoot ref={ref} ownerState={ownerState} {...other}>
      <StatValue ownerState={ownerState}>{value}</StatValue>
      <StatUnit ownerState={ownerState}>{unit}</StatUnit>
    </StatRoot>
  );

  return (
    <ThemeProvider theme={theme}>
      <Tooltip title={title ?? `${unit}: ${value}`}>{Component}</Tooltip>
    </ThemeProvider>
  );
});

export const StatPercentage = forwardRef<HTMLDivElement, StatProps>(function Stat(inProps, ref) {
  const props = useThemeProps({ props: inProps, name: 'MuiStat' });
  const { value, unit, color, variant, title, ...other } = props;
  const ownerState = { ...props, color, variant };
  const roundedValue = Math.round(Number(value));
  const progressColor = roundedValue > 90 ? 'success' : roundedValue > 40 ? 'warning' : 'error';

  return (
    <Tooltip title={title ?? `${unit}: ${roundedValue}%`}>
      <StatRoot ref={ref} ownerState={ownerState} sx={{ justifyContent: 'center' }} {...other}>
        <StatValue ownerState={ownerState} sx={{ mb: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <CircularProgress variant="determinate" color={progressColor} value={Number(value)} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Typography variant="caption" component="div" color="text.secondary">
                {roundedValue}%
              </Typography>
            </Box>
          </Box>
        </StatValue>
        <StatUnit ownerState={ownerState}>{unit}</StatUnit>
      </StatRoot>
    </Tooltip>
  );
});
