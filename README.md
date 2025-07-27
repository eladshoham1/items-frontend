# Equipment Management System - Frontend

A React TypeScript application for managing equipment, users, receipts, and daily reports.

## 🚀 Architecture Overview

This project has been refactored to follow modern React best practices with a clean, scalable architecture.

### 📁 Project Structure

```
src/
├── components/          # React components organized by feature
│   ├── users/          # User management components
│   ├── items/          # Item management components
│   ├── receipts/       # Receipt management components
│   ├── report/         # Daily report components
│   └── modal/          # Shared modal components
├── config/             # Application configuration
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── style/              # Global styles
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001
```

### Changing Server URL

To change the server URL, update the `REACT_APP_API_URL` environment variable in:
- `.env.local` for local development
- Your deployment environment variables for production

The application will automatically use the configured URL for all API calls.

## 🏗️ Key Features

### 1. Centralized API Management
- **Single Configuration Point**: All API calls use a centralized configuration
- **Type Safety**: Full TypeScript support for all API interactions

### 2. Custom Hooks
- **useUsers**: User management with CRUD operations
- **useItems**: Item management with status tracking
- **useReports**: Daily report management and statistics

### 3. Service Layer
- **userService**: User CRUD operations
- **itemService**: Item management
- **receiptService**: Receipt creation and management
- **reportService**: Daily reports and statistics

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
