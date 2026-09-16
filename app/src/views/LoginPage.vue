<template>
  <ion-page>
    <ion-content :fullscreen="true" class="dark-content" :scroll-y="false">
      <div class="screen">
        <div class="body">
          <div class="logo"><span class="msym">museum</span></div>
          <h1 class="wordmark">Museo</h1>
          <p class="tagline">
            Find museums, book timed entry, carry your ticket.
          </p>

          <form class="fields" @submit.prevent="submit">
            <div>
              <div class="museo-field-label">Email</div>
              <input
                v-model.trim="email"
                class="museo-input-dark"
                type="email"
                inputmode="email"
                autocomplete="email"
                required
              />
            </div>
            <div>
              <div class="museo-field-label">Password</div>
              <input
                v-model="password"
                class="museo-input-dark"
                type="password"
                autocomplete="current-password"
                required
              />
            </div>

            <p v-if="auth.error" class="error">{{ auth.error }}</p>

            <button
              class="museo-btn submit"
              type="submit"
              :disabled="auth.loading"
            >
              {{ auth.loading ? "Logging in…" : "Log in" }}
            </button>
          </form>

          <p class="switch">
            New here?
            <span @click="router.push('/register')">Create an account</span>
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

// prefilled with the seeded demo account
const email = ref("maja@example.com");
const password = ref("museodemo");

async function submit() {
  if (await auth.login(email.value, password.value)) {
    router.replace("/tabs/discover");
  }
}
</script>

<style scoped>
.dark-content {
  --background: var(--museo-dark);
}

.screen {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--museo-dark);
  color: var(--museo-cream);
}

.body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 28px;
}

.logo {
  width: 52px;
  height: 52px;
  border-radius: 5px;
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}
.logo .msym {
  font-size: 30px;
  color: #fff;
}

.wordmark {
  font: 700 40px var(--museo-display);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 0.98;
  margin: 0;
}

.tagline {
  font: 400 15px var(--museo-text);
  color: var(--museo-muted-dark-2);
  margin: 10px 0 0;
  line-height: 1.45;
}

.fields {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.submit {
  margin-top: 12px;
  height: 50px;
  font-size: 14px;
}

.error {
  font: 500 12.5px var(--museo-text);
  color: #ff8a6a;
  margin: 2px 0 0;
}

.switch {
  text-align: center;
  margin: 18px 0 0;
  font: 500 13px var(--museo-text);
  color: var(--museo-muted-dark-2);
}
.switch span {
  color: var(--museo-cream);
  font-weight: 700;
  cursor: pointer;
  border-bottom: var(--museo-border) solid var(--museo-ember);
  padding-bottom: 1px;
}
</style>
