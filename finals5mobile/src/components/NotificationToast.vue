<template>
  <transition name="slide-down">
    <div 
      v-if="isVisible" 
      class="notification-toast"
      :class="{ 'is-closing': isClosing }"
      @click="handleClick"
    >
      <div class="notification-content">
        <!-- Icône de l'app -->
        <div class="notification-icon">
          <img :src="icon" alt="App Icon" />
        </div>

        <!-- Contenu -->
        <div class="notification-body">
          <div class="notification-header">
            <span class="app-name">{{ appName }}</span>
            <span class="notification-time">{{ timeAgo }}</span>
          </div>
          
          <h3 class="notification-title">{{ title }}</h3>
          <p class="notification-text">{{ body }}</p>

          <!-- Image si présente -->
          <img 
            v-if="image" 
            :src="image" 
            class="notification-image" 
            alt="Notification image"
          />
        </div>

        <!-- Bouton fermer -->
        <button class="close-button" @click.stop="close">
          <ion-icon :icon="closeOutline"></ion-icon>
        </button>
      </div>

      <!-- Barre de progression -->
      <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';

interface NotificationProps {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  appName?: string;
  duration?: number;
  onClick?: () => void;
}

const props = withDefaults(defineProps<NotificationProps>(), {
  icon: '/icon.png',
  image: '',
  appName: 'MyApp',
  duration: 5000,
  onClick: () => {}
});

const emit = defineEmits(['close']);

const isVisible = ref(false);
const isClosing = ref(false);
const progressWidth = ref(100);
const startTime = ref(Date.now());

const timeAgo = computed(() => {
  const seconds = Math.floor((Date.now() - startTime.value) / 1000);
  if (seconds < 60) return 'maintenant';
  if (seconds < 120) return 'il y a 1 min';
  return `il y a ${Math.floor(seconds / 60)} min`;
});

let progressInterval: any = null;
let autoCloseTimeout: any = null;

const show = () => {
  isVisible.value = true;
  startProgress();
};

const startProgress = () => {
  const interval = 50; // Mise à jour toutes les 50ms
  const decrement = (interval / props.duration) * 100;

  progressInterval = setInterval(() => {
    progressWidth.value -= decrement;
    if (progressWidth.value <= 0) {
      clearInterval(progressInterval);
    }
  }, interval);

  // Auto-fermeture
  autoCloseTimeout = setTimeout(() => {
    close();
  }, props.duration);
};

const close = () => {
  isClosing.value = true;
  
  if (progressInterval) clearInterval(progressInterval);
  if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

  setTimeout(() => {
    isVisible.value = false;
    isClosing.value = false;
    emit('close');
  }, 300);
};

const handleClick = () => {
  props.onClick();
  close();
};

onMounted(() => {
  show();
});

defineExpose({ close });
</script>

<style scoped>
.notification-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  cursor: pointer;
  z-index: 10000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-toast:active {
  transform: translateX(-50%) scale(0.98);
}

.notification-content {
  display: flex;
  padding: 12px;
  gap: 12px;
  position: relative;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  background: #f0f0f0;
}

.notification-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.app-name {
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 11px;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #000;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-text {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.notification-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 8px;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.2);
}

.close-button ion-icon {
  font-size: 16px;
  color: #333;
}

.progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #2196F3);
  transition: width 50ms linear;
}

/* Animations */
.slide-down-enter-active {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-leave-active {
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideDown {
  from {
    transform: translateX(-50%) translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-100px);
    opacity: 0;
  }
}

.is-closing {
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mode sombre */
@media (prefers-color-scheme: dark) {
  .notification-toast {
    background: #1e1e1e;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }

  .notification-title {
    color: #fff;
  }

  .notification-text {
    color: #ccc;
  }

  .app-name {
    color: #fff;
  }

  .notification-header {
    color: #999;
  }

  .close-button {
    background: rgba(255, 255, 255, 0.1);
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-button ion-icon {
    color: #fff;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .notification-toast {
    top: 10px;
    width: calc(100% - 20px);
  }
}
</style>