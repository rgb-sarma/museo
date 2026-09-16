<template>
  <ion-page>
    <ion-content :fullscreen="true" class="dark-content">
      <div class="screen">
        <div class="topbar">
          <button class="iconbtn" type="button" @click="router.back()">
            <span class="msym">arrow_back</span>
          </button>
        </div>

        <div class="body mscroll">
          <h1 class="title">Create account</h1>
          <p class="subtitle">It takes a second — verification is mocked for the demo.</p>

          <form class="fields" @submit.prevent="submit">
            <div>
              <div class="museo-field-label">Full name</div>
              <input
                v-model.trim="fullName"
                class="museo-input-dark"
                placeholder="Maja Jovanović"
                autocomplete="name"
                required
              />
            </div>
            <div>
              <div class="museo-field-label">Email</div>
              <input
                v-model.trim="email"
                class="museo-input-dark"
                type="email"
                inputmode="email"
                placeholder="you@example.com"
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
                placeholder="••••••••"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <p v-if="auth.error" class="error">{{ auth.error }}</p>

            <button class="museo-btn submit" type="submit" :disabled="auth.loading">
              {{ auth.loading ? 'Creating…' : 'Continue' }}
            </button>
          </form>

          <div class="note">
            <span class="msym">verified</span>
            <span>We've sent a confirmation email (mocked). Tap continue to keep going.</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const fullName = ref('');
const email = ref('');
const password = ref('');

async function submit() {
  if (await auth.register(fullName.value, email.value, password.value)) {
    router.replace('/tabs/discover');
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

.topbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 14px 16px 6px;
}

.iconbtn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: var(--museo-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.iconbtn .msym {
  font-size: 20px;
  color: var(--museo-cream);
}

.body {
  flex: 1 1 auto;
  padding: 8px 28px 28px;
}

.title {
  font: 700 30px var(--museo-display);
  letter-spacing: -0.02em;
  text-transform: uppercase;
  line-height: 1;
  margin: 0;
}

.subtitle {
  font: 400 14px var(--museo-text);
  color: var(--museo-muted-dark-2);
  margin: 8px 0 0;
}

.fields {
  margin-top: 24px;
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

.note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 16px;
  font: 400 12px var(--museo-text);
  color: var(--museo-muted-dark);
  line-height: 1.45;
}
.note .msym {
  font-size: 16px;
  color: var(--museo-ember);
  flex: 0 0 auto;
}
</style>
