import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const setAuthHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

let isRefreshing = false;
const pendingQueue = [];
let storeInstance = null;
let authActions = null;

const processQueue = (error, token) => {
  pendingQueue.splice(0, pendingQueue.length).forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
};

const getStore = async () => {
  if (storeInstance) {
    return storeInstance;
  }
  const module = await import('@/store/index.js');
  storeInstance = module.default ?? module.store ?? module;
  return storeInstance;
};

const getAuthActions = async () => {
  if (authActions) {
    return authActions;
  }
  const module = await import('@/store/slices/authSlice.js');
  authActions = {
    setCredentials: module.setCredentials,
    clearAuthState: module.clearAuthState,
  };
  return authActions;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error ?? {};
    if (!response || !config) {
      return Promise.reject(error);
    }

    if (
      response.status !== 401 ||
      config._retry ||
      config.skipAuthRefresh ||
      !config.headers?.Authorization
    ) {
      return Promise.reject(error);
    }

    const originalRequest = config;
    originalRequest._retry = true;

    const store = await getStore();
    const { setCredentials, clearAuthState } = await getAuthActions();

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (token) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await apiClient.post(
        '/auth/refresh',
        null,
        { skipAuthRefresh: true },
      );
      const data = refreshResponse.data?.data;
      if (!data?.accessToken) {
        throw new Error('Access token missing');
      }

      setAuthHeader(data.accessToken);
      store.dispatch(setCredentials({
        user: data.user,
        accessToken: data.accessToken,
      }));
      processQueue(null, data.accessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(clearAuthState());
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
