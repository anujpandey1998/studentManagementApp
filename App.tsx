import React, { useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

const App = () => {
  const [ready, setReady] = useState(false);

  if (!ready) return <SplashScreen onFinish={() => setReady(true)} />;

  return <AppNavigator />;
};

export default App;
