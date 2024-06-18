import type { NavLinkProps } from '@remix-run/react';
import { Form, NavLink } from '@remix-run/react';
import type { ElementRef } from 'react';
import { useContext, useRef } from 'react';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu';
import { AbilityContext, Can } from '~/context/auth-context';
import { useUser } from '~/hooks/use-user';
import { cn } from '~/lib/utils';

function ListItem({ children, className, title, ...props }: NavLinkProps & { title: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <NavLink
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className,
          )}
          {...props}>
          {({ isActive, isPending, isTransitioning }) => {
            return (
              <>
                <div className="text-sm font-medium leading-none">{title}</div>
                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {typeof children === 'function' ? children({ isActive, isPending, isTransitioning }) : children}
                </p>
              </>
            );
          }}
        </NavLink>
      </NavigationMenuLink>
    </li>
  );
}

function MainNav() {
  const userAbilities = useContext(AbilityContext);

  return (
    <NavigationMenu className="mx-6">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <NavLink to="/v2/dashboard">Dashboard</NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 lg:w-[600px]">
                <ListItem title="Products finder" to="/products">
                </ListItem>
                  <ListItem title="Manage Products" to="/products">
                  </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {/* <Can do="read" on="products"> -- note: filtering links on permissions
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 lg:w-[600px]">
                <ListItem title="Products finder" to="/products">
                </ListItem>
                <Can do="create" on="products">
                  <ListItem title="Add Products" to="/products">
                  </ListItem>
                </Can>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </Can> */}
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <NavLink to="/about">About</NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function UserNav() {
  const user = useUser();
  const fallback = user.email.slice(0, 2) || '??';
  const logoutButtonRef = useRef<ElementRef<'button'>>(null);

  function onLogOutPress() {
    logoutButtonRef.current?.click();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email.split('@').at(0)}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Form action="/logout" method="post">
          <button ref={logoutButtonRef} type="submit" />
          <DropdownMenuItem onClick={onLogOutPress}>Log out</DropdownMenuItem>
        </Form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </div>
  );
}
