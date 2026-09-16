import { http } from './client';
import type {
  Booking,
  Museum,
  MuseumDetail,
  MuseumQuery,
  Review,
  TokenResponse,
  User,
} from './types';

export const authApi = {
  async register(body: {
    email: string;
    password: string;
    full_name: string;
  }): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/register', body);
    return data;
  },
  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await http.post<TokenResponse>('/auth/login', { email, password });
    return data;
  },
  async me(): Promise<User> {
    const { data } = await http.get<User>('/auth/me');
    return data;
  },
};

export const museumsApi = {
  async list(query: MuseumQuery = {}): Promise<Museum[]> {
    const params: Record<string, string | number> = {};
    if (query.city) params.city = query.city;
    if (query.category) params.category = query.category;
    if (query.min_rating) params.min_rating = query.min_rating;
    if (query.q) params.q = query.q;
    if (query.sort) params.sort = query.sort;
    const { data } = await http.get<Museum[]>('/museums', { params });
    return data;
  },
  async detail(id: number): Promise<MuseumDetail> {
    const { data } = await http.get<MuseumDetail>(`/museums/${id}`);
    return data;
  },
  async reviews(id: number): Promise<Review[]> {
    const { data } = await http.get<Review[]>(`/museums/${id}/reviews`);
    return data;
  },
  async addReview(id: number, rating: number, comment: string | null): Promise<Review> {
    const { data } = await http.post<Review>(`/museums/${id}/reviews`, { rating, comment });
    return data;
  },
  async myReviews(): Promise<Review[]> {
    const { data } = await http.get<Review[]>('/reviews/me');
    return data;
  },
};

export const bookingsApi = {
  async slots(): Promise<string[]> {
    const { data } = await http.get<string[]>('/bookings/slots');
    return data;
  },
  async list(when?: 'upcoming' | 'past'): Promise<Booking[]> {
    const { data } = await http.get<Booking[]>('/bookings', {
      params: when ? { when } : {},
    });
    return data;
  },
  async get(id: number): Promise<Booking> {
    const { data } = await http.get<Booking>(`/bookings/${id}`);
    return data;
  },
  async create(body: {
    museum_id: number;
    visit_date: string;
    time_slot: string;
    num_tickets: number;
  }): Promise<Booking> {
    const { data } = await http.post<Booking>('/bookings', body);
    return data;
  },
  async cancel(id: number): Promise<Booking> {
    const { data } = await http.patch<Booking>(`/bookings/${id}/cancel`);
    return data;
  },
};

export * from './types';
export { API_BASE_URL, errorMessage } from './client';
