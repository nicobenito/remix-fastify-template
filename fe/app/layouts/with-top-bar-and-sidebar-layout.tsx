import AccountCircle from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoIcon from '@mui/icons-material/Info';
import Logout from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import InventoryIcon from '@mui/icons-material/Inventory';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import type { ListItemButtonBaseProps } from '@mui/material/ListItemButton/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { CSSObject, Theme } from '@mui/material/styles';
import { styled, useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { LinkProps } from '@remix-run/react';
import { Form, Link, Link as RouterLink } from '@remix-run/react';
import { UserPlusIcon } from 'lucide-react';
import type { MouseEventHandler, ReactElement, ReactNode } from 'react';
import { forwardRef, useMemo, useState } from 'react';
import { useGlobalPendingState } from 'remix-utils/use-global-navigation-state';
import { useSpinDelay } from 'spin-delay';

import { Can, useUserAbilities } from '~/context/auth-context';
import { useUser } from '~/hooks/use-user';

import { version } from '../../package.json';
import { Avatar, Container } from '@mui/material';

function VersionBox() {
  return (
    <Box sx={{ margin: 1, textAlign: 'center' }}>
      <Typography variant="overline">{version}</Typography>
    </Box>
  );
}

type WithTopBarAndSidebarLayoutProps = {
  children: ReactNode;
};

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

interface ListItemLinkProps extends ListItemButtonBaseProps {
  icon?: ReactElement;
  primary: string;
  to: string;
  isBold?: boolean;
}

function ListItemLink({ icon, primary, to, isBold, ...props }: ListItemLinkProps) {
  const renderLink = useMemo(
    () =>
      forwardRef<HTMLAnchorElement, Omit<LinkProps, 'to'>>(function Link(itemProps, ref) {
        return <RouterLink to={to} ref={ref} {...itemProps} role={undefined} />;
      }),
    [to],
  );

  return (
    <ListItem disablePadding>
      <Tooltip title={primary} placement="right">
        <ListItemButton component={renderLink} {...props} sx={{ width: '100px' }}>
          {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
          <ListItemText
            primary={primary}
            primaryTypographyProps={{ fontWeight: isBold ? 'bold' : 'auto', noWrap: true }}
            title={primary}>
            {icon}
          </ListItemText>
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
}

export function WithTopBarAndSidebarLayout({ children }: WithTopBarAndSidebarLayoutProps) {
  const user = useUser();
  const theme = useTheme();
  const isIdle = useGlobalPendingState() === 'idle';
  const showSpinner = useSpinDelay(!isIdle, {
    delay: 200,
    minDuration: 300,
  });
  const [open, setOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<HTMLButtonElement | null>(null);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleOpenUserMenu: MouseEventHandler<HTMLButtonElement> = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" open={open} sx={{borderTop:'4px double white', borderRight:'4px double white'}}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Platform{' '}
            <Fade in={showSpinner}>
              <CircularProgress size="1rem" sx={{ color: 'white' }} />
            </Fade>
          </Typography>
          <Box>
            <IconButton color="inherit" onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Typography variant="h6" noWrap component="div">
                {user.email} {'\u00A0'}
              </Typography>
              <AccountCircle />
            </IconButton>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}>
              <Form action="/logout" method="post">
                <MenuItem component={Button} type="submit">
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Form>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open} >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose} title={open ? 'Open drawer' : 'Close drawer'}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ height: '100%' }}>
          <ListItemLink to="/dashboard" primary="Dashboard" isBold={true} icon={<DashboardIcon />}></ListItemLink>
          <ListItemLink to="/products" primary="Products Management" isBold icon={<InventoryIcon />} />
          <ListItemLink to="/about" primary="About" isBold icon={<InfoIcon />} />
        </List>
        <VersionBox />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          p: 3,
          border:'4px double white'
        }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
