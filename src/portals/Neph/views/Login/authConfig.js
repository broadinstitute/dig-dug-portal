import { LogLevel, PublicClientApplication } from '@azure/msal-browser';

// Config object to be passed to Msal on creation
export const msalConfig = {
  auth: {
    clientId: '4a13eb1d-7802-4d02-81ac-bba1e1d30499',
    authority: 'https://login.microsoftonline.com/b54d35ba-107b-42c5-bd3c-20380e971c06',
    redirectUri: '/', // Must be registered as a SPA redirectURI on your app registration
    postLogoutRedirectUri: '/' // Must be registered as a SPA redirectURI on your app registration
  },
  cache: {
    cacheLocation: 'localStorage'
  },
  system: {
      loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
              if (containsPii) {
                  return;
              }
              switch (level) {
                  case LogLevel.Error:
                      console.error(message);
                      return;
                  case LogLevel.Info:
                      console.info(message);
                      return;
                  case LogLevel.Verbose:
                      console.debug(message);
                      return;
                  case LogLevel.Warning:
                      console.warn(message);
                      return;
                  default:
                      return;
              }
          },
          logLevel: LogLevel.Verbose
      }
  }
};

