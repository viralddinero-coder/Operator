import React from 'react';
import AppRouter from './router';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';

function App() {
  // Initialize authentication
  useAuth();

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" />
    </>
  );
}

export default App;
