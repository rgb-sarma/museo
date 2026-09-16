<template>
  <ion-page>
    <ion-content :fullscreen="true" :scroll-y="false">
      <div class="screen">
        <div class="head">
          <h1 class="title">Search</h1>

          <div class="searchbar">
            <span class="msym">search</span>
            <input
              :value="museums.filters.q"
              placeholder="Museum name…"
              enterkeyhint="search"
              @input="onQuery"
            />
            <span
              v-if="museums.filters.q"
              class="msym clear"
              @click="clearQuery"
              >close</span
            >
          </div>

          <div class="chips mscroll">
            <button
              v-for="c in CATEGORY_CHIPS"
              :key="c.label"
              type="button"
              class="chip"
              :class="{ on: museums.filters.category === c.value }"
              @click="museums.setFilters({ category: c.value })"
            >
              {{ c.label }}
            </button>
          </div>

          <div class="filters">
            <div class="filter">
              <div class="museo-field-label tight">Min rating</div>
              <div class="chips-row">
                <button
                  v-for="r in RATINGS"
                  :key="r.label"
                  type="button"
                  class="chip small"
                  :class="{ on: museums.filters.minRating === r.value }"
                  @click="museums.setFilters({ minRating: r.value })"
                >
                  {{ r.label }}
                </button>
              </div>
            </div>
            <div class="filter">
              <div class="museo-field-label tight">Sort</div>
              <div class="chips-row">
                <button
                  v-for="s in SORTS"
                  :key="s.label"
                  type="button"
                  class="chip small"
                  :class="{ on: museums.filters.sort === s.value }"
                  @click="museums.setFilters({ sort: s.value })"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="results mscroll">
          <StateBlock
            v-if="museums.searchLoading && !museums.results.length"
            loading
          />

          <StateBlock
            v-else-if="museums.searchError"
            icon="cloud_off"
            title="Can't reach the API"
            :message="museums.searchError"
            action-label="Try again"
            @action="museums.search()"
          />

          <template v-else>
            <div class="count">{{ museums.results.length }} results</div>
            <div v-if="museums.results.length" class="rows">
              <MuseumRow
                v-for="m in museums.results"
                :key="m.id"
                :museum="m"
                @open="(id) => router.push(`/museum/${id}`)"
              />
            </div>
            <StateBlock
              v-else
              icon="search_off"
              title="No matches"
              message="Try a different name, or loosen the filters."
            />
          </template>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from "@ionic/vue";
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import MuseumRow from "@/components/MuseumRow.vue";
import StateBlock from "@/components/StateBlock.vue";
import { useMuseumsStore } from "@/stores/museums";
import { CATEGORY_CHIPS } from "@/utils/format";

const router = useRouter();
const museums = useMuseumsStore();

const RATINGS = [
  { label: "Any", value: 0 },
  { label: "4.0+", value: 4 },
  { label: "4.5+", value: 4.5 },
];

const SORTS = [
  { label: "Top rated", value: "top_rated" as const },
  { label: "Price", value: "price" as const },
];

let debounce: ReturnType<typeof setTimeout> | undefined;

function onQuery(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  clearTimeout(debounce);
  debounce = setTimeout(() => museums.setFilters({ q: value }), 250);
}

function clearQuery() {
  clearTimeout(debounce);
  museums.setFilters({ q: "" });
}

onMounted(() => {
  if (!museums.results.length) void museums.search();
});

onUnmounted(() => clearTimeout(debounce));
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
  padding: 6px 20px 0;
  padding-top: calc(6px + var(--ion-safe-area-top, 0px));
}

.title {
  font: 700 22px var(--museo-display);
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--museo-ink);
  margin: 12px 0 0;
}

.searchbar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 14px;
  border-radius: var(--museo-radius);
  background: var(--museo-card);
  border: var(--museo-border) solid var(--museo-line);
}
.searchbar .msym {
  font-size: 20px;
  color: var(--museo-muted-2);
}
.searchbar .clear {
  cursor: pointer;
}
.searchbar input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: 500 14px var(--museo-text);
  color: var(--museo-ink);
}

.chips {
  display: flex;
  gap: 7px;
  margin-top: 12px;
  overflow-x: auto;
}

.chip {
  flex: 0 0 auto;
  font: 700 11px var(--museo-text);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 7px 13px;
  border-radius: var(--museo-radius-sm);
  border: var(--museo-border) solid var(--museo-line);
  background: var(--museo-card);
  color: var(--museo-body-2);
}
.chip.on {
  border-color: var(--museo-ember);
  background: var(--museo-ember);
  color: #fff;
}
.chip.small {
  padding: 6px 10px;
  letter-spacing: 0;
}

.filters {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}
.filter {
  flex: 1;
}
.museo-field-label.tight {
  font-size: 9px;
}
.chips-row {
  display: flex;
  gap: 6px;
}

.results {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 14px 20px 24px;
}

.count {
  font: 600 10px var(--museo-text);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--museo-muted-2);
  margin-bottom: 10px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
