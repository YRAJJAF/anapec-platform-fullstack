import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)));
  failedQueue = [];
};

api.interceptors.response.use(
  (r) => r.data,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((res, rej) => failedQueue.push({ resolve: res, reject: rej }))
          .then((t) => { orig.headers.Authorization = `Bearer ${t}`; return api(orig); });
      }
      orig._retry = true; isRefreshing = true;
      try {
        const rt = localStorage.getItem('refreshToken');
        const uid = localStorage.getItem('userId');
        if (!rt || !uid) throw new Error('no refresh');
        const r = await axios.post(`${BASE_URL}/auth/refresh`, { userId: uid, refreshToken: rt });
        const { accessToken, refreshToken: nrt } = (r.data as any).data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', nrt);
        processQueue(null, accessToken);
        orig.headers.Authorization = `Bearer ${accessToken}`;
        return api(orig);
      } catch (e) { processQueue(e, null); localStorage.clear(); window.location.href = '/auth/login'; return Promise.reject(e); }
      finally { isRefreshing = false; }
    }
    return Promise.reject((error?.response?.data as any) ?? error);
  },
);

export const authApi = {
  register: (d: any) => api.post('/auth/register', d),
  login: (d: any) => api.post('/auth/login', d),
  logout: (rt?: string) => api.post('/auth/logout', { refreshToken: rt }),
  me: () => api.get('/auth/me'),
};
export const testsApi = {
  list: (p?: any) => api.get('/tests', { params: p }),
  getForCandidate: (id: string) => api.get(`/tests/${id}/candidate`),
  getById: (id: string) => api.get(`/tests/${id}`),
  getStats: (id: string) => api.get(`/tests/${id}/stats`),
  create: (d: any) => api.post('/tests', d),
  update: (id: string, d: any) => api.put(`/tests/${id}`, d),
  addQuestion: (id: string, d: any) => api.post(`/tests/${id}/questions`, d),
};
export const sessionsApi = {
  start: (testId: string) => api.post('/sessions/start', { testId }),
  submitAnswer: (sid: string, d: any) => api.post(`/sessions/${sid}/answer`, d),
  complete: (sid: string) => api.post(`/sessions/${sid}/complete`),
  getMySessions: () => api.get('/sessions/my'),
  getById: (id: string) => api.get(`/sessions/${id}`),
};
export const remediationApi = {
  getCourses: (p?: any) => api.get('/remediation/courses', { params: p }),
  getCourse: (id: string) => api.get(`/remediation/courses/${id}`),
  enroll: (courseId: string) => api.post(`/remediation/courses/${courseId}/enroll`),
  completeLesson: (cid: string, lid: string) => api.put(`/remediation/courses/${cid}/lessons/${lid}/complete`),
  getRecommendations: () => api.get('/remediation/recommendations'),
  getMyEnrollments: () => api.get('/remediation/my-enrollments'),
};
export const reportingApi = {
  getOverview: () => api.get('/reporting/overview'),
  getUsers: (p?: any) => api.get('/reporting/users', { params: p }),
  getEngagement: (days?: number) => api.get('/reporting/engagement', { params: { days } }),
  getRegional: () => api.get('/reporting/regional'),
  getMyProgress: () => api.get('/reporting/my-progress'),
};
export const certificatesApi = {
  getMyCertificates: () => api.get('/certificates/my'),
  downloadUrl: (id: string) => `${BASE_URL}/certificates/${id}/download`,
};
export const usersApi = {
  list: (p?: any) => api.get('/users', { params: p }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateMe: (d: any) => api.put('/users/me', d),
  update: (id: string, d: any) => api.put(`/users/${id}`, d),
  setActive: (id: string, v: boolean) => api.put(`/users/${id}/active`, { isActive: v }),
  bulkImport: (users: any[]) => api.post('/users/bulk-import', { users }),
};
export const languagesApi = { list: () => api.get('/languages') };
