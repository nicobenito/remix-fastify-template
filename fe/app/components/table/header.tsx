import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

type MaterialReactTableHeaderWrapProps = {
  children?: ReactNode | undefined;
};

export function MaterialReactTableHeaderWrap({ children }: MaterialReactTableHeaderWrapProps) {
  return <Box sx={{ whiteSpace: 'pre-line', wordWrap: 'break-word' }}>{children}</Box>;
}
