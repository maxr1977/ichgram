import { io } from 'socket.io-client';

let socketInstance = null;

const buildSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) {
    return explicit;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    return window.location.origin;
  }

  try {
    const url = new URL(apiUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, '/');
    return url.origin;
  } catch (error) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
};

export const connectSocket = () => {
  const url = buildSocketUrl();
  if (socketInstance) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  socketInstance = io(url, {
    withCredentials: true,
    autoConnect: true,
  });

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

