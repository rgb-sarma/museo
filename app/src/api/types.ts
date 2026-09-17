export type Category =
  | "art"
  | "history"
  | "natural_history"
  | "science"
  | "nature"
  | "archaeology"
  | "ethnographic"
  | "childrens"
  | "culture"
  | "specialty";

export type ExhibitionType = "temporary" | "permanent" | "special";
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Exhibition {
  id: number;
  title: string;
  description: string;
  type: ExhibitionType;
  start_date: string;
  end_date: string | null;
  image_url: string;
}

export interface Museum {
  id: number;
  name: string;
  category: Category;
  description: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string;
  opening_hours: string;
  admission_fee: number;
  avg_rating: number;
  review_count: number;
}

export interface MuseumDetail extends Museum {
  contact: string;
  exhibitions: Exhibition[];
}

export interface Review {
  id: number;
  museum_id: number;
  museum_name: string;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Booking {
  id: number;
  museum: Museum;
  visit_date: string;
  time_slot: string;
  num_tickets: number;
  total_price: number;
  status: BookingStatus;
  reference: string;
  created_at: string;
}

export interface MuseumQuery {
  city?: string;
  category?: Category;
  min_rating?: number;
  q?: string;
  sort?: "top_rated" | "price" | "name";
}
