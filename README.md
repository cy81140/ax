# Amino App

A social networking mobile application built with React Native and Expo.

## Navigation Structure

The app's navigation is organized hierarchically:

1. **RootStack**: The outermost navigator that handles authentication state
   - **AuthStack**: Shown when the user is not logged in
     - Login Screen
     - Register Screen
   - **MainTabNavigator**: Shown when the user is logged in
     - **HomeTab**: Feed and post details
     - **ChatTab**: Messaging functionality
     - **CreateTab**: Content creation
     - **SearchTab**: Search functionality
     - **NotificationsTab**: User notifications
     - **ProfileTab**: User profile and settings

All navigation types are defined in `src/navigation/types.ts`.

## Responsive Design

The app implements a responsive design system that works across mobile and web platforms:

### Core Components
- **useResponsive**: A custom hook in `src/hooks/useResponsive.tsx` that provides device information and responsive helpers
- **ResponsiveView**: A wrapper component in `src/components/ui/ResponsiveView.tsx` that applies different styles based on device type
- **Responsive Utilities**: Helper functions in `src/styles/responsive.ts` for consistent spacing, typography, and responsive calculations

### Key Features
- **Device Detection**: Automatically detects device type (mobile/tablet/desktop)
- **Platform Adaptation**: Applies specific styles for web vs native platforms
- **Flexible Layouts**: Components adapt to different screen sizes
- **Responsive Typography**: Text scales appropriately across devices

### Breakpoints
```
small: 375px   // Small phone
medium: 768px  // Large phone / small tablet
large: 1024px  // Tablet / small desktop
xlarge: 1280px // Desktop / large tablet
```

## Development Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase account

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/amino-app.git
   cd amino-app
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the project root with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   expo start
   ```

## Database Setup

If you're using Supabase as your backend, set up a trigger to create a user profile when a new user is created:

```sql
-- Create a trigger to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile_for_user(); 