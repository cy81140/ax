module.exports = {
  expo: {
    name: "Amino App",
    slug: "amino-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL || "YOUR_SUPABASE_URL",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY",
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}; 