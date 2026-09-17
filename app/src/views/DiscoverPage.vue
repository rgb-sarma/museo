<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <header class="head">
          <div class="head-row">
            <div class="head-left">
              <span class="eyebrow">Discover</span>
              <button class="city" type="button" @click="pickCity">
                <span class="msym pin">location_on</span>
                {{ museums.city }}
                <span class="msym chev">expand_more</span>
              </button>
            </div>
            <div v-if="auth.isAuthenticated" class="avatar">
              {{ auth.initials }}
            </div>
            <button
              v-else
              class="signin"
              type="button"
              @click="router.push('/login')"
            >
              Log in
            </button>
          </div>

          <button
            class="searchbar"
            type="button"
            @click="router.push('/tabs/search')"
          >
            <span class="msym">search</span>
            <span>Search museums &amp; exhibitions</span>
          </button>
        </header>

        <div class="list mscroll">
          <div class="list-head">
            <span class="museo-section-title">Popular near you</span>
            <span class="seeall" @click="router.push('/tabs/search')"
              >See all</span
            >
          </div>

          <StateBlock v-if="museums.discoverLoading" loading />

          <StateBlock
            v-else-if="museums.discoverError"
            icon="cloud_off"
            title="Can't reach the API"
            :message="museums.discoverError"
            action-label="Try again"
            @action="museums.loadDiscover()"
          />

          <StateBlock
            v-else-if="!museums.discover.length"
            icon="museum"
            title="Nothing in this city"
            message="Try another city from the picker above."
          />

          <div v-else class="cards">
            <MuseumCard
              v-for="m in museums.discover"
              :key="m.id"
              :museum="m"
              :origin="museums.origin"
              @open="openMuseum"
            />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, actionSheetController } from "@ionic/vue";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import MuseumCard from "@/components/MuseumCard.vue";
import StateBlock from "@/components/StateBlock.vue";
import { useAuthStore } from "@/stores/auth";
import { CITIES, useMuseumsStore } from "@/stores/museums";

const router = useRouter();
const auth = useAuthStore();
const museums = useMuseumsStore();

onMounted(() => {
  void museums.detectCity();
});

function openMuseum(id: number) {
  router.push(`/museum/${id}`);
}

async function pickCity() {
  const sheet = await actionSheetController.create({
    header: "Choose a city",
    buttons: [
      ...CITIES.map((c) => ({
        text: c.name,
        handler: () => museums.setCity(c.name),
      })),
      { text: "Cancel", role: "cancel" },
    ],
  });
  await sheet.present();
}
</script>

<style scoped>
.screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--museo-surface);
}

.head {
  flex: 0 0 auto;
  background: var(--museo-dark);
  padding-top: var(--ion-safe-area-top, 0px);
  padding-bottom: 18px;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.eyebrow {
  font: 600 10px var(--museo-text);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
}

.city {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: 700 25px var(--museo-display);
  letter-spacing: -0.01em;
  color: var(--museo-cream);
  text-transform: uppercase;
}
.city .pin {
  font-size: 21px;
  color: var(--museo-ember);
}
.city .chev {
  font-size: 18px;
  color: var(--museo-muted-2);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--museo-radius);
  background: var(--museo-ember);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 15px var(--museo-display);
  color: #fff;
  flex: 0 0 auto;
}

.signin {
  flex: 0 0 auto;
  height: 40px;
  padding: 0 14px;
  border: var(--museo-border) solid var(--museo-dark-line-2);
  border-radius: var(--museo-radius);
  background: none;
  cursor: pointer;
  font: 700 11px var(--museo-text);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--museo-cream);
}

.searchbar {
  margin: 14px 20px 0;
  width: calc(100% - 40px);
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: var(--museo-radius);
  background: var(--museo-dark-3);
  cursor: pointer;
  font: 400 13.5px var(--museo-text);
  color: var(--museo-muted-dark);
}
.searchbar .msym {
  font-size: 19px;
  color: var(--museo-muted-2);
}

.list {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 0 20px 24px;
}

.list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 16px 0 10px;
}
.list-head .museo-section-title {
  font-size: 16px;
}

.seeall {
  font: 700 11px var(--museo-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--museo-ember);
  cursor: pointer;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
