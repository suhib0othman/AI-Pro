import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div>
      <h1>Login</h1>
      <button onClick={onLogin}>Login with Google</button>
    </div>
  );
};

export default LoginScreen;
