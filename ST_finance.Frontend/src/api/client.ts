import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5213";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized and perform Refresh Token Rotation (RTR)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Endpoints whose own 401 response means "invalid credentials" / "not yet authenticated",
// not "your session expired" — a refresh attempt here is meaningless (there's no session to
// refresh yet) and must not trigger the redirect-to-login side effect below.
const AUTH_ENDPOINTS_EXCLUDED_FROM_REFRESH = [
  "/api/auth/login",
  "/api/auth/login/verify-2fa",
  "/api/auth/register",
  "/api/auth/register/send-otp",
  "/api/auth/refresh-token",
  "/api/auth/forgot-password/send-otp",
  "/api/auth/forgot-password/reset",
];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl: string = originalRequest?.url || "";
    const isExcludedAuthEndpoint = AUTH_ENDPOINTS_EXCLUDED_FROM_REFRESH.some((path) =>
      requestUrl.includes(path)
    );

    // Guard: only attempt refresh if response is 401, we haven't already retried, and this
    // wasn't one of the auth endpoints above (whose 401 is a normal credentials/validation
    // failure, not an expired session).
    if (error.response?.status === 401 && !originalRequest._retry && !isExcludedAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (!accessToken || !refreshToken) {
          throw new Error("No tokens found in local storage.");
        }

        // Call the refresh-token endpoint (use raw axios to avoid interceptor loop)
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          accessToken,
          refreshToken,
        });

        // The response body matches our unified Result wrapper pattern:
        // { isSuccess: true, value: { accessToken: "...", refreshToken: "..." } }
        const result = response.data;
        if (result.isSuccess && result.value) {
          const newAccess = result.value.accessToken;
          const newRefresh = result.value.refreshToken;

          localStorage.setItem("accessToken", newAccess);
          localStorage.setItem("refreshToken", newRefresh);

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          processQueue(null, newAccess);
          isRefreshing = false;

          return apiClient(originalRequest);
        } else {
          throw new Error("Refresh token rotation failed.");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear local storage and force redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userProfile");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
