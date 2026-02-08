// frontend/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v0';
const TOKEN_KEY = 'fincred_token';

// --- Token Management ---
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// --- HTTP Helpers ---
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({})); // Handle empty responses

  if (!response.ok) {
    throw new Error(data.detail || `HTTP error! status: ${response.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// --- Service Objects ---

export const authService = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', new URLSearchParams(data).toString().replace(/%40/g, '@') // OAuth2PasswordRequestForm expects form data
    ).then(res => {
      // The backend expects x-www-form-urlencoded for OAuth2 password flow, but let's check if we can send JSON or if we need to adjust content-type.
      // Wait, the backend uses `OAuth2PasswordRequestForm = Depends()`. This strictly expects form data.
      // Let's adjust the request to handle non-JSON body for login specifically.
      return res;
    }),

  getMe: () => api.get<any>('/users/me'),
};

// Re-implementing login to support Form Data for OAuth2
const loginRequest = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json() as Promise<{ access_token: string }>;
};

// Update authService.login
authService.login = (data) => loginRequest(data.username, data.password);


export const goalsService = {
  list: () => api.get<any[]>('/goals'),
  create: (goal: any) => api.post<any>('/goals', goal),
  update: (id: string, goal: any) => api.put<any>(`/goals/${id}`, goal),
};

export const dashboardService = {
  getSummary: () => api.get<any>('/dashboard'),
};

export const onboardingService = {
  submitSnapshot: (data: any) => api.put<any>('/snapshot', data),
};
