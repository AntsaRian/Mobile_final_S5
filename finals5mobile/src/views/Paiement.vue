<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h2>Paiement</h2>
      
      <div v-if="!idsValides" class="error-card">
        <p style="color: red;">❌ Informations manquantes</p>
        <p>ID Utilisateur: {{ userId || 'MANQUANT' }}</p>
        <p>ID Voiture: {{ voitureId || 'MANQUANT' }}</p>
        <ion-button @click="router.back()">Retour</ion-button>
      </div>
      
      <div v-else class="info-card">
        <p>ID Utilisateur: <strong>{{ userId }}</strong></p>
        <p>ID Voiture: <strong>{{ voitureId }}</strong></p>
      </div>

      <ion-button 
        @click="confirmerPaiement" 
        expand="block" 
        :disabled="processing || !idsValides"
        v-if="idsValides"
      >
        <ion-spinner v-if="processing" name="crescent"></ion-spinner>
        {{ processing ? 'Traitement...' : 'Payer maintenant' }}
      </ion-button>

      <br>

      <ion-button 
        @click="router.back()" 
        expand="block" 
        fill="outline"
        :disabled="processing"
      >
        Annuler
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCurrentUser } from '@/services/authService';
import { 
  IonPage, IonContent, IonButton, IonSpinner 
} from '@ionic/vue';
import { alertController } from '@ionic/vue';
import { payer_reparation } from '@/services/paiementService';

const route = useRoute();
const router = useRouter();
const userId = ref('');
const voitureId = ref('');
const processing = ref(false);

const idsValides = computed(() => {
  return userId.value && voitureId.value;
});

onMounted(() => {
  // Récupérer voitureId depuis l'URL
  voitureId.value = route.query.voitureId as string;
  
  // Essayer de récupérer userId depuis l'URL ou l'auth
  const urlUserId = route.query.userId as string;
  if (urlUserId) {
    userId.value = urlUserId;
  } else {
    // Fallback: récupérer depuis l'auth
    const user = getCurrentUser();
    userId.value = user?.uid || '';
  }
  
  console.log("IDs récupérés:", { userId: userId.value, voitureId: voitureId.value });
});

async function confirmerPaiement() {
  if (!idsValides.value) {
    alertController.create({
      header: 'Erreur',
      message: 'Informations manquantes',
      buttons: ['OK']
    }).then(alert => alert.present());
    return;
  }
  
  const alert = await alertController.create({
    header: 'Confirmation',
    message: 'Confirmer le paiement de la réparation?',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { 
        text: 'Payer', 
        handler: () => effectuerPaiement()
      }
    ]
  });
  await alert.present();
}

async function effectuerPaiement() {
  processing.value = true;
  try {
    // Appel avec seulement 2 paramètres maintenant
    const result = await payer_reparation(userId.value, voitureId.value);
    
    if (result.success) {
      alertController.create({
        header: 'Succès',
        message: 'Paiement effectué !',
        buttons: [{
          text: 'OK',
          handler: () => router.replace('/home?refresh=' + Date.now())
        }]
      }).then(alert => alert.present());
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    alertController.create({
      header: 'Erreur',
      message: error.message || 'Paiement échoué',
      buttons: ['OK']
    }).then(alert => alert.present());
  } finally {
    processing.value = false;
  }
}
</script>

<style scoped>
.info-card {
  background: var(--ion-color-light);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.error-card {
  background: rgba(255, 0, 0, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid red;
}
</style>