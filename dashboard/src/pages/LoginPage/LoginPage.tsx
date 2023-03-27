import React, { useEffect } from "react";

const LoginPage: React.FC = () => {
  useEffect(() => {
    const handleAuthorization = async () => {
      try {
        const user = await authorize();
        // Redirect to the dashboard page after successfully authenticating
      } catch (error) {
        console.error("Error authenticating with Discord:", error);
        // Display an error message to the user
      }
    };

    handleAuthorization();
  }, []);

  return (
    <div>
      <p>Logging in with Discord...</p>
    </div>
  );
};

export default LoginPage;
