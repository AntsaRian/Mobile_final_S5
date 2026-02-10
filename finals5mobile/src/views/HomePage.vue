<template>
  <ion-page>
    <ion-header class="main-header">
      <ion-toolbar class="main-toolbar">
        <ion-title class="main-title" style="margin-left: 20px;">Mon Garage</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout" class="logout-btn">
            <ion-icon slot="icon-only" :icon="logOutOutline" class="logout-icon"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <!-- <ion-button @click="enableNotif" expand="block" class="enable-btn">
        Activer les notifications
      </ion-button> -->

      <!-- Notification In-App -->
      <div v-if="showNotification" class="notification-overlay">
        <div class="notification-card" :class="{ 'slide-in': showNotification }">
          <div class="notification-header">
            <ion-icon :icon="notificationsOutline" class="notification-icon"></ion-icon>
            <button class="close-btn" @click="closeNotification">X</button> 
          </div>
          <small class="notification-time">{{ notificationTime }}</small>
          <h3 class="notification-title">{{ notificationData.title }}</h3>
          <p class="notification-body">{{ notificationData.body }}</p>
          <br>
          <button class="paiement_rep" @click="goToPayment($event)">Payer</button>
        </div>
      </div>

      <!-- Section d'accueil améliorée -->
      <div class="welcome-card" v-if="user">
        <div class="welcome-content">
          <h2 class="welcome-title">Bonjour, {{ user.displayName || user.email }}</h2>
          <p class="welcome-subtitle">Gérez vos réparations de voiture</p>
        </div>
        <div class="user-avatar">
          <div class="avatar-placeholder">
            {{ getInitials(user.displayName || user.email) }}
          </div>
        </div>
      </div>

      <!-- Bouton d'ajout principal -->
      <div class="action-section">
        <ion-button 
          expand="block" 
          @click="router.push('/ajouter-voiture')"
          class="add-btn"
        >
          <ion-icon slot="start" :icon="addCircleOutline" class="add-icon"></ion-icon>
          Ajouter une voiture en panne
        </ion-button>
      </div>

      <!-- Liste des voitures -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" class="loading-spinner"></ion-spinner>
        <p class="loading-text">Chargement de vos voitures...</p>
      </div>

      <div v-else-if="userVoitures.length === 0" class="empty-state">
        <div class="empty-illustration">
          <ion-icon :icon="carOutline" class="empty-icon"></ion-icon>
        </div>
        <h3 class="empty-title">Aucune voiture en réparation</h3>
        <p class="empty-text">Commencez par ajouter votre première voiture en panne</p>
        <ion-button 
          @click="router.push('/ajouter-voiture')" 
          fill="outline"
          class="empty-btn"
        >
          Ajouter une voiture
        </ion-button>
      </div>

      <div v-else class="voitures-section">
        <div class="section-header">
          <h3 class="section-title" style="color: black;">Mes voitures en réparation</h3>
          <span class="section-count">{{ userVoitures.length }}</span>
        </div>
        
        <div class="voitures-grid">
          <div 
            v-for="item in userVoitures" 
            :key="item.id" 
            class="voiture-card"
            @click="voirDetails(item.id)"
          >
            <div class="voiture-header">
              <h4 class="voiture-model">
                {{ item.voiture.modele }} 
                <small>({{ formatTypeVehicule(item.voiture.typeVehicule) }})</small>
              </h4>
              <div class="voiture-actions">
                <!-- Actions supplémentaires si besoin -->
              </div>
            </div>
            
            <div class="voiture-details">
              <!-- Afficher toutes les pannes -->
              <div class="detail-item">
                <span class="detail-label">Panne(s):</span>
                <div class="pannes-list">
                  <template v-if="item.pannesNoms && item.pannesNoms.length > 0">
                    <span 
                      v-for="(panne, index) in item.pannesNoms" 
                      :key="index"
                      class="panne-tag"
                    >
                      {{ panne }}
                    </span>
                  </template>
                  <span v-else class="detail-value">Aucune panne</span>
                </div>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">État:</span>
                <span class="etat-badge" :class="getEtatClass(item.etatNom)">
                  {{ formatEtatNom(item.etatNom) }}
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Déposée le:</span>
                <span class="detail-value">{{ formatDate(item.userVoitureData.createdAt) }}</span>
              </div>
              
              <!-- Optionnel: Afficher le nombre de pannes -->
              <div v-if="item.pannesNoms && item.pannesNoms.length > 0" class="detail-item">
                <span class="detail-label">Nombre de pannes:</span>
                <span class="detail-value">{{ item.pannesNoms.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Message d'erreur global -->
    <ion-toast
      :is-open="!!toastMessage"
      :message="toastMessage"
      :duration="3000"
      @didDismiss="toastMessage = ''"
      :color="toastColor"
      position="bottom"
    ></ion-toast>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { auth } from '@/firebase/config'
import { 
  getUserVoituresWithDetails,
  createOrUpdateUser,
} from '@/services/firestoreService'
import { logout, getCurrentUser } from '@/services/authService'
import { saveTokenToFirestore } from '@/services/firestoreService'
import type { User } from 'firebase/auth'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonToast,
  alertController
} from '@ionic/vue'
import { 
  addCircleOutline, 
  carOutline, 
  trashOutline, 
  logOutOutline,
  eyeOutline
} from 'ionicons/icons'

import { useRoute } from 'vue-router';

import { ref, onMounted, onUnmounted, onBeforeMount, watch } from 'vue';
import { messaging } from "@/firebase/config";
import { getToken, onMessage } from "firebase/messaging";
import { notificationsOutline } from 'ionicons/icons';

// USER ET VOITURES
const router = useRouter()
const route = useRoute();
const user = ref<User | null>(null)
const userVoitures = ref<any[]>([])
const loading = ref(true)
const toastMessage = ref('')
const toastColor = ref('primary')
const typeVehicule = ref<string>('')

onMounted(() => {
  chargerVoitures();
});

// Surveillance de la route - recharge quand on revient sur la page
// Surveillance de la route ET des query params
watch(
  () => ({ path: route.path, query: route.query.refresh }),
  (newVal, oldVal) => {
    // Si on revient sur Home OU si le param refresh change
    if (newVal.path === '/home') {
      console.log("🔄 Rechargement Home (route change ou refresh)");
      chargerVoitures();
    }
  },
  { deep: true }  // Important: surveille les objets en profondeur
);

// Recharge aussi quand la page devient visible (si on revient par tab/back)
onBeforeMount(() => {
  console.log("🔄 Préparation Home...");
  // S'assurer que l'utilisateur est à jour
  user.value = getCurrentUser();
});

function formatTypeVehicule(type: string): string {
  switch(type) {
    case 'particulier':
      return 'Voiture particulière';
    case 'poids_lourd':
      return 'Poids lourd';
    default:
      return type;
  }
}

// Fonction pour charger les voitures
async function chargerVoitures() {
  loading.value = true;
  try {
    // Récupère l'utilisateur à chaque appel
    user.value = getCurrentUser();
    
    if (user.value) {
      const result = await getUserVoituresWithDetails(user.value.uid);
      if (result.success && result.data) {
        userVoitures.value = result.data;
        console.log(`✅ ${result.data.length} voiture(s) chargée(s)`);
      }
    }
  } catch (error) {
    console.error('Erreur chargement voitures:', error);
    showToast('Erreur lors du chargement des voitures', 'danger');
  } finally {
    loading.value = false;
  }
}

function getInitials(name: string): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function getEtatClass(etatNom: string): string {
  const etat = etatNom.toLowerCase()
  if (etat.includes('attente')) return 'etat-warning'
  if (etat.includes('réparation') || etat.includes('reparation')) return 'etat-primary'
  if (etat.includes('terminé') || etat.includes('termine')) return 'etat-success'
  if (etat.includes('payé') || etat.includes('paye')) return 'etat-medium'
  return 'etat-light'
}

function formatEtatNom(etatNom: string): string {
  return etatNom.charAt(0).toUpperCase() + etatNom.slice(1).toLowerCase()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function confirmerSuppression(userVoitureId: string, voitureId: string) {
  const alert = await alertController.create({
    header: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer cette voiture ? Cette action est irréversible.',
    cssClass: 'custom-alert',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
        cssClass: 'alert-cancel'
      },
      {
        text: 'Supprimer',
        cssClass: 'alert-danger',
        handler: async () => {
          userVoitures.value = userVoitures.value.filter(v => v.id !== userVoitureId)
          showToast('Voiture supprimée avec succès', 'success')
        }
      }
    ]
  })
  
  await alert.present()
}

function voirDetails(userVoitureId: string) {
  // Pour l'instant, on affiche un toast
  showToast('Page détails en développement', 'info')
  // router.push(`/details-voiture/${userVoitureId}`)
}

async function handleLogout() {
  const alert = await alertController.create({
    header: 'Déconnexion',
    message: 'Voulez-vous vous déconnecter de votre compte ?',
    cssClass: 'custom-alert',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel',
        cssClass: 'alert-cancel'
      },
      {
        text: 'Déconnecter',
        cssClass: 'alert-primary',
        handler: async () => {
          const result = await logout()
          if (result.success) {
            router.push('/auth')
          }
        }
      }
    ]
  })
  
  await alert.present()
}

function showToast(message: string, color: string) {
  toastMessage.value = message
  toastColor.value = color
}

// NOTIFICATION
const token = ref('');
const showNotification = ref(false);
const notificationData = ref({ 
  title: '', 
  body: '', 
  voitureId: '',
  cout: '',
  modele: '',
  typeVoiture: ''
});
const notificationTime = ref('');

const enableNotif = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("❌ Notifications refusées");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const tokenValue = await getToken(messaging, {
      vapidKey: "BIMzOSrj05ObO7THu_5Xse1xkSabvKKyVxZAOW1CkuYD9ydnyctP9VKTQ-KZU2qMrKSCXa6P32EV3TzYlxkC2AM",
      serviceWorkerRegistration: registration
    });

    token.value = tokenValue;
    console.log("✅ Token FCM:", tokenValue);
    
    // SAUVEGARDE AUTOMATIQUE
    const user = getCurrentUser();
    if (user) {
      await saveTokenToFirestore(user.uid, tokenValue);
    }
    
  } catch (err) {
    console.error("Erreur:", err);
    showCustomNotification("Erreur", "Impossible d'activer les notifications", {});
  }
};

// Afficher une notification custom
const showCustomNotification = (title: string, body: string, data: any) => {
  console.log("🎯 showCustomNotification appelée");
  console.log("   Title:", title);
  console.log("   Body:", body);
  console.log("   Data:", data);
  
  notificationData.value = { 
    title, 
    body,
    voitureId: data.voiture_id || '',
    cout: data.cout || '',
    modele: data.modele || '',
    typeVoiture: data.typeVoiture || ''
  };
  
  notificationTime.value = new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  showNotification.value = true;
  
  console.log("✅ Notification affichée");
  console.log("✅ showNotification.value =", showNotification.value);
};

// Navigation vers la page paiement
const goToPayment = (event: Event) => {
  event.stopPropagation();
  event.preventDefault();
  
  if (notificationData.value.voitureId) {
    // Récupère l'utilisateur courant
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid;
    
    if (!userId) {
      alert("Utilisateur non connecté");
      return;
    }
    
    showNotification.value = false;
    
    // Navigation avec les deux IDs
    window.location.href = `/paiement?voitureId=${notificationData.value.voitureId}&userId=${userId}`;
  }
};

const closeNotification = () => {
  showNotification.value = false;
};

// ========================================
// ÉCOUTER LES MESSAGES DU SERVICE WORKER
// ========================================
let messageHandler: ((event: MessageEvent) => void) | null = null;

onMounted(() => {
  console.log("🔧 Montage du composant - écoute des notifications");
  enableNotif();
  
  // ========================================
  // CAS 1 : APP OUVERTE (FOREGROUND)
  // ========================================
  onMessage(messaging, (payload) => {
    console.log("📱 [FOREGROUND] Notification reçue:", payload);
    
    let title = payload.notification?.title || payload.data?.title || "Notification";
    let body = payload.notification?.body || payload.data?.body || "";
    let data = payload.data || {};
    
    console.log("📝 Affichage notification foreground");
    showCustomNotification(title, body, data);
  });
  
  // ========================================
  // CAS 2 : APP EN ARRIÈRE-PLAN OU FERMÉE
  // Écouter les messages du Service Worker
  // ========================================
  if ('serviceWorker' in navigator) {
    messageHandler = (event: MessageEvent) => {
      console.log("📬 [BACKGROUND] Message reçu du Service Worker:", event.data);
      
      if (event.data && event.data.type === 'firebase-notification') {
        const payload = event.data.payload;
        
        console.log("🔔 Notification depuis Service Worker");
        console.log("📦 Payload:", payload);
        
        // Extraire les données
        let title = payload.notification?.title || payload.data?.title || "Notification";
        let body = payload.notification?.body || payload.data?.body || "";
        let data = payload.data || {};
        
        console.log("📝 Titre:", title);
        console.log("📝 Body:", body);
        console.log("📦 Data:", data);
        
        // AFFICHER LA NOTIFICATION DANS L'APP
        showCustomNotification(title, body, data);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', messageHandler);
    console.log("✅ Écoute des messages du Service Worker activée");
  }
});

// Nettoyer les listeners
onUnmounted(() => {
  if (messageHandler && 'serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
    console.log("🧹 Listener Service Worker nettoyé");
  }
});
</script>

<style scoped>
/* =====================================================
   STYLES GÉNÉRAUX – APPLICATION GARAGE
===================================================== */

/* Styles généraux */
.main-content {
  --background: var(--garage-bg);
  --padding-start: 20px;
  --padding-end: 20px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

/* En-tête */
.main-header {
  background: var(--garage-primary);
  box-shadow: var(--garage-shadow);
}

.main-toolbar {
  --background: var(--garage-primary);
  --color: var(--garage-text-light);
  --border-width: 0;
}

.main-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.logout-btn {
  --background: transparent;
  --color: var(--garage-text-light);
  --background-hover: rgba(255, 255, 255, 0.1);
  --border-radius: 50%;
  width: 44px;
  height: 44px;
}

.logout-icon {
  font-size: 22px;
}

/* =====================================================
   CARTE DE BIENVENUE
===================================================== */

.welcome-card {
  background: linear-gradient(
    135deg,
    var(--garage-primary) 0%,
    var(--garage-primary-dark) 100%
  );
  border-radius: var(--garage-radius);
  padding: 25px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--garage-text-light);
  box-shadow: var(--garage-shadow);
  transition: var(--garage-transition);
}

.welcome-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--garage-shadow-hover);
}

.welcome-content {
  flex: 1;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.user-avatar {
  margin-left: 20px;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: var(--garage-text-light);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* =====================================================
   SECTION ACTION
===================================================== */

.action-section {
  margin-bottom: 30px;
}

.add-btn {
  --background: var(--garage-accent);
  --background-hover: #3da3a4;
  --background-activated: #3da3a4;
  --border-radius: 14px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --box-shadow: var(--garage-shadow);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
  transition: var(--garage-transition);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--garage-shadow-hover);
}

.add-icon {
  font-size: 22px;
  margin-right: 8px;
}

/* =====================================================
   ÉTAT DE CHARGEMENT
===================================================== */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: var(--garage-accent);
  margin-bottom: 20px;
}

.loading-text {
  color: var(--garage-text-main);
  font-size: 15px;
  opacity: 0.8;
}

/* =====================================================
   ÉTAT VIDE
===================================================== */

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--garage-card);
  border-radius: var(--garage-radius);
  box-shadow: var(--garage-shadow-light);
  margin-top: 20px;
}

.empty-illustration {
  margin-bottom: 25px;
}

.empty-icon {
  font-size: 80px;
  color: var(--garage-accent);
  opacity: 0.7;
}

.empty-title {
  font-size: 20px;
  color: var(--garage-text-main);
  margin: 0 0 10px 0;
  font-weight: 600;
}

.empty-text {
  color: var(--garage-text-main);
  opacity: 0.7;
  font-size: 15px;
  margin: 0 0 25px 0;
  line-height: 1.5;
}

.empty-btn {
  --border-color: var(--garage-accent);
  --color: var(--garage-accent);
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

/* =====================================================
   SECTION VOITURES
===================================================== */

.voitures-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  color: var(--garage-text-main);
  margin: 0;
  font-weight: 600;
}

.section-count {
  background: var(--garage-accent);
  color: var(--garage-text-light);
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  min-width: 30px;
  text-align: center;
}

/* Grille */
.voitures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.voiture-card {
  background: var(--garage-card);
  border-radius: var(--garage-radius);
  padding: 20px;
  box-shadow: var(--garage-shadow-light);
  border: 1px solid var(--garage-border);
  transition: var(--garage-transition);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  color: var(--garage-text-main);
}

.voiture-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--garage-shadow-hover);
  border-color: var(--garage-accent);
}

.voiture-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.voiture-model {
  font-size: 18px;
  color: var(--garage-text-main);
  margin: 0;
  font-weight: 600;
}

.voiture-actions {
  display: flex;
  gap: 8px;
}

/* Dans votre fichier CSS global ou scoped */

.pannes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.panne-tag {
  background-color: var(--ion-color-light);
  color: var(--ion-color-dark);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-block;
  margin: 2px 0;
}

.voiture-details .detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
}

.detail-label {
  font-weight: 600;
  color: var(--ion-color-medium);
  min-width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: var(--ion-color-dark);
  flex-grow: 1;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--garage-danger);
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--garage-transition);
}

.action-btn:hover {
  background: rgba(229, 57, 53, 0.1);
}

/* Détails */
.voiture-details {
  flex: 1;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--garage-border);
}

.detail-label {
  font-size: 13px;
  opacity: 0.7;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

/* Badges */
.etat-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* =====================================================
   CONTAINER & NOTIFICATIONS (CSS FUSIONNÉ)
===================================================== */

.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.enable-btn {
  --background: #3880ff;
  --background-hover: #3171e0;
  height: 50px;
  font-weight: 600;
  margin-bottom: 30px;
}

.close-btn {
  color: red;
  background: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
  font-size: medium;
}

.close-btn:hover {
  color: #3880ff;
}

/* Notification Overlay */
.notification-header {
  display: flex;
  justify-content: space-between;
}

.notification-overlay {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;
  animation: fadeIn 0.3s ease;
}

.notification-card {
  position: relative;
  top: 40px;
  width: 320px;
  background: white;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: dropdown 0.25s ease;
  color: #212529;
}

.notification-card.slide-in {
  transform: translateX(0);
}

.paiement_rep {
  border: transparent 0.5px solid;
  background-color: transparent;
  border-radius: 40px;
  padding: 8px;
  text-decoration: none;
  color: #3171e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: bold;
  font-size: medium;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.paiement_rep:hover {
  color: green;
  background-color: #3da2a453;
}

/* =====================================================
   RESPONSIVE
===================================================== */

@media (max-width: 768px) {
  .voitures-grid {
    grid-template-columns: 1fr;
  }

  .notification-overlay {
    left: 10px;
    right: 10px;
  }

  .notification-card {
    left: 10%;
  }
}
</style>