
# Project Starter Template Remix + Fastify + Prisma

This repository provides a solid foundation for starting new projects. It integrates frontend and backend technologies and includes authentication and authorization features.

## Table of Contents

- [Technologies](#technologies)
- [Features](#features)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [License](#license)

## Technologies

### Frontend
- **[Remix](https://remix.run/)**: A modern React framework for building web applications.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly building custom designs.
- **[Material UI](https://mui.com/)**: React components for faster and easier web development.

### Backend
- **[Fastify](https://www.fastify.io/)**: A fast and low overhead web framework for Node.js.
- **[Prisma](https://www.prisma.io/)**: A next-generation ORM for Node.js and TypeScript.

### Authentication and Authorization
- **[Auth0](https://auth0.com/)**: Authentication and authorization as a service.

## Features

- **Frontend**: 
  - Responsive UI with Tailwind CSS and Material UI components.
  - Seamless navigation with Remix.
- **Backend**:
  - Fastify for efficient request handling.
  - Prisma ORM for database management.
- **Authentication and Authorization**:
  - Integrated with Auth0 to manage user authentication.
  - Permissions-based access control for views and API endpoints.

## Getting Started

### Prerequisites

- **Node.js** (>=14.x)
- **npm** (>=6.x) or **yarn** (>=1.x)
- **PostgreSQL** (or any other Prisma-supported database)

### Installation

1. **Clone the repository:**

2. **Install dependencies:**

    ```sh
    pnpm install
    ```

3. **Create a `.env` file:**

    Fill in the necessary environment variables, especially those related to your database and Auth0 configuration. `env.d.ts` on each `be` and `fe` folders displays required envs.

4. **Setup the database:**

    ```sh
    pnpm run db:migrate
    ```

### Running the project

1. **Start the development server:**

    ```sh
    FE: pnpm run dev
    # and
    BE: pnpm run cli
    ```

2. Open your browser and navigate to `http://localhost:3002`.

## Configuration

### Auth0 Integration

Ensure you have the following environment variables set in your `.env` file:

- `AUTH0_DOMAIN`: Your Auth0 domain.
- `AUTH0_CLIENT_ID`: Your Auth0 client ID.
- `AUTH0_CLIENT_SECRET`: Your Auth0 client secret.
- `AUTH0_AUDIENCE`: Your Auth0 API audience.

### Prisma

Configure your database connection in the `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Run Prisma migrations to set up the database schema:

```sh
npx prisma migrate dev
```

## Usage

### Frontend

- **Tailwind CSS**: Customize styles in the `tailwind.config.js` file.
- **Material UI**: Use Material UI components in your Remix routes and components.

### Backend

- **Fastify**: Add new routes in the `src/routes` directory.
- **Prisma**: Use Prisma Client to interact with the database in your Fastify routes.

### Authentication and Authorization

- **Auth0**: Protect routes and endpoints by checking user permissions.

## License
Feel free to adjust the content to better match your project's specifics and preferences.