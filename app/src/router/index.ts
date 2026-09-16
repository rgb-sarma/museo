import { createRouter, createWebHistory } from "@ionic/vue-router";
import type { RouteRecordRaw } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import TabsPage from "@/views/TabsPage.vue";

const routes: Array<RouteRecordRaw> = [
  { path: "/", redirect: "/tabs/discover" },

  {
    path: "/login",
    component: () => import("@/views/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/register",
    component: () => import("@/views/RegisterPage.vue"),
    meta: { public: true },
  },

  {
    path: "/tabs/",
    component: TabsPage,
    children: [
      { path: "", redirect: "/tabs/discover" },
      { path: "discover", component: () => import("@/views/DiscoverPage.vue") },
      { path: "search", component: () => import("@/views/SearchPage.vue") },
      { path: "bookings", component: () => import("@/views/BookingsPage.vue") },
      { path: "profile", component: () => import("@/views/ProfilePage.vue") },
    ],
  },

  // stacked over the tabs so they get a full-screen push transition.
  {
    path: "/museum/:id",
    component: () => import("@/views/MuseumDetailPage.vue"),
  },
  {
    path: "/museum/:id/book",
    component: () => import("@/views/BookingPage.vue"),
  },
  {
    path: "/museum/:id/pay",
    component: () => import("@/views/PaymentPage.vue"),
  },
  {
    path: "/museum/:id/review",
    component: () => import("@/views/ReviewPage.vue"),
  },
  { path: "/booking/:id", component: () => import("@/views/TicketPage.vue") },
  {
    path: "/booking/:id/success",
    component: () => import("@/views/SuccessPage.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) return "/login";
  // skip the auth screens if already signed in
  if (to.meta.public && auth.isAuthenticated) return "/tabs/discover";
  return true;
});

export default router;
