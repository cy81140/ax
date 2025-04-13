# Amino App Clone

A simplified version of the Amino app, focusing on a single shared community where users can engage, share content, and communicate. The chatrooms are organized by regions and provinces in the Philippines.

## Features

- User Authentication (Registration, Login, Profile Management)
- Content Creation and Sharing (Text posts, Images, Videos, Polls, Quizzes)
- Direct Messaging (One-on-one and Group chat)
- Push Notifications
- Search Functionality
- Activity Feeds
- Moderation System

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase
  - Authentication
  - Database (PostgreSQL)
  - Storage
  - Real-time Communication
- **UI Components**: React Native Paper

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd amino-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and external services
├── utils/          # Utility functions
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── constants/      # Constants and theme
└── assets/         # Static assets
```

## Development

The project follows a phased development approach:

1. Project Setup and User Authentication
2. Content Creation and Sharing
3. Direct Messaging and Chatrooms
4. Search and Activity Feeds
5. Moderation System and Testing
6. Deployment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 