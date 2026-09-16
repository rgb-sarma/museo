import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { authApi, errorMessage, type User } from '@/api';
import { TOKEN_KEY } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => token.value !== null);
  const initials = computed(() =>
    (user.value?.full_name ?? '?').trim().charAt(0).toUpperCase(),
  );

  function setSession(accessToken: string, nextUser: User) {
    token.value = accessToken;
    user.value = nextUser;
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.login(email, password);
      setSession(res.access_token, res.user);
      return true;
    } catch (err) {
      error.value = errorMessage(err, 'Could not log in');
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(
    full_name: string,
    email: string,
    password: string,
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.register({ full_name, email, password });
      setSession(res.access_token, res.user);
      return true;
    } catch (err) {
      error.value = errorMessage(err, 'Could not create your account');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Called on boot when a token is already in storage — proves it is still valid. */
  async function restore(): Promise<void> {
    if (!token.value) return;
    try {
      user.value = await authApi.me();
    } catch {
      logout();
    }
  }

  function logout(): void {
    token.value = null;
    user.value = null;
    error.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    initials,
    login,
    register,
    restore,
    logout,
  };
});
