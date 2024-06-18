import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, Link, useNavigation } from '@remix-run/react';

import { authenticator } from '~/services/auth.server';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  let redirectTo = '/login';
  if (formData.get('returnTo')) {
    redirectTo += `?returnTo=${formData.get('returnTo')}`;
  }

  return authenticator.logout(request, { redirectTo });
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/login',
  });

  return null;
}

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Log out · Company Platform',
    },
  ];
};

export default function Logout() {
  const navigation = useNavigation();

  return (
    <Box
      component="main"
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexGrow: 1,
        minHeight: '100%',
      }}>
      <Container maxWidth="md">
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <Typography align="center" color="textPrimary" variant="h1">
            Log out of Platform?
          </Typography>
          <Form action="/logout" method="post">
            <LoadingButton
              color="primary"
              endIcon={<LogoutIcon />}
              loading={['loading', 'submitting'].includes(navigation.state)}
              loadingIndicator={navigation.state === 'submitting' ? 'Logging out' : 'Redirecting'}
              size="large"
              type="submit"
              variant="contained">
              Log out
            </LoadingButton>
          </Form>
          <Button
            component={Link}
            size="large"
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{ mt: 3 }}
            to="/"
            variant="outlined">
            Cancel
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
