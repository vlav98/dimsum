// import queryString from "query-string";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  locale: string;
}

export const authorize = async (): Promise<DiscordUser> => {
  // Construct the authorization URL
  const params = {
    client_id: process.env.REACT_APP_DISCORD_CLIENT_ID,
    redirect_uri: process.env.REACT_APP_DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
  };
  const authorizeUrl =
    "https://discord.com/api/oauth2/authorize?client_id=1044293317757763675&redirect_uri=http%3A%2F%2Flocalhost%3A3000&response_type=code&scope=identify";

  // Open the Discord authorization page in a new window
  const authWindow = window.open(authorizeUrl, "_blank");

  // Wait for the user to complete the authorization flow
  const { code } = await new Promise<{ code?: string; error?: string }>(
    (resolve) => {
      const checkAuthorization = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkAuthorization);
          resolve({ error: "Authorization window closed" });
        } else if (
          authWindow.location.href.startsWith(
            process.env.REACT_APP_DISCORD_REDIRECT_URI
          )
        ) {
          clearInterval(checkAuthorization);
          authWindow.close();
          const { code, error } = queryString.parse(authWindow.location.search);
          if (error) {
            resolve({ error });
          } else {
            resolve({ code: code as string });
          }
        }
      }, 1000);
    }
  );

  if (code) {
    // Exchange the authorization code for an access token
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: queryString.stringify({
        client_id: process.env.REACT_APP_DISCORD_CLIENT_ID,
        client_secret: process.env.REACT_APP_DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REACT_APP_DISCORD_REDIRECT_URI,
      }),
    });
    const data = await response.json();

    // Fetch the user's Discord account information
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    const user = await userResponse.json();

    return user;
  } else {
    throw new Error(`Discord authorization failed: ${err}`);
  }
};
