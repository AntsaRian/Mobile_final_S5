<template>
  <ion-page>
    <ion-header class="main-header">
      <ion-toolbar class="main-toolbar">
        
        <ion-title class="main-title" style="margin-left: 20px;">Ajouter une voiture</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <div class="form-wrapper">
        <div class="form-card">
          <!-- En-tête du formulaire -->
          <div class="form-header">
            <div class="form-icon">
              <ion-icon :icon="carOutline" class="header-icon"></ion-icon>
            </div>
            <h2 class="form-title">Décrire la panne de votre voiture</h2>
            <p class="form-subtitle">Remplissez les informations nécessaires pour ajouter votre voiture en réparation</p>
          </div>

          <!-- Formulaire -->
          <div class="form-content">
            <!-- Modèle de la voiture -->
            <div class="form-group">
              <label class="form-label">
                Modèle de la voiture
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <ion-input 
                  v-model="modele" 
                  type="text"
                  placeholder="Ex: Toyota Corolla, Renault Clio, Peugeot 208..."
                  required
                  class="custom-input"
                ></ion-input>
                <div class="input-icon">
                  <ion-icon :icon="carOutline"></ion-icon>
                </div>
              </div>               
              <small v-if="!modele.trim() && formTouched" class="error-message">
                Le modèle est requis
              </small>
            </div>

            <div class="form-group">
              <label class="form-label">
                Type de véhicule
                <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <select 
                  v-model="typeVehicule" 
                  class="custom-select"
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="particulier">Voiture particulière</option>
                  <option value="Voiture de sport">Voiture de sport</option>
                  <option value="4 Roues motrice">4 Roues motrice</option>
                </select>
              </div>
              <small v-if="!typeVehicule && formTouched" class="error-message">
                Le type de véhicule est requis
              </small>
            </div>

            <!-- Sélection de la panne -->
            <div class="form-group">
              <label class="form-label">
                Type(s) de panne
                <span class="required">*</span>
              </label>
              
              <div class="pannes-checkbox-group">
                <ion-item 
                  v-for="panne in pannes" 
                  :key="panne.id"
                  lines="none"
                  class="panne-checkbox-item"
                >
                  <ion-checkbox 
                    slot="start" 
                    :checked="pannesSelectionnees.includes(panne.id)"
                    @ion-change="togglePanneSelection($event, panne.id)"
                  ></ion-checkbox>
                  <ion-label class="ion-text-wrap">
                    {{ panne.nom }}
                  </ion-label>
                </ion-item>
              </div>
              
              <small v-if="pannesSelectionnees.length === 0 && formTouched" class="error-message">
                Au moins une panne est requise
              </small>
            </div>

            <!-- Bouton d'ajout -->
            <div class="form-actions">
              <ion-button 
                expand="block" 
                @click="ajouterVoiture"
                :disabled="!formValide"
                class="submit-btn"
              >
                <ion-icon slot="start" :icon="addCircleOutline" class="btn-icon"></ion-icon>
                Ajouter la voiture au garage
              </ion-button>

              <button 
                type="button" 
                @click="annuler"
                class="cancel-btn"
              >
                Annuler
              </button>
            </div>

            <!-- Indicateur de validation -->
            <div v-if="formTouched" class="validation-indicator">
              <div class="indicator-dot" :class="{ valid: formValide }"></div>
              <span class="indicator-text">
                {{ formValide ? 'Formulaire valide' : 'Remplissez tous les champs obligatoires' }}
              </span>
            </div>

            <!-- Message de statut -->
            <div v-if="messageStatut.text" class="status-message" :class="messageStatut.color">
              <ion-icon 
                :icon="messageStatut.color === 'success' ? checkmarkCircleOutline : alertCircleOutline"
                class="status-icon"
              ></ion-icon>
              <p>{{ messageStatut.text }}</p>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase/config'
import { 
  getPannes, 
  ajouterVoitureAvecPannes 
} from '@/services/firestoreService'
import type { Panne } from '@/firebase/config'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonToast,
  loadingController,
  IonCheckbox,
  IonItem,
  IonLabel
} from '@ionic/vue'
import { 
  carOutline,
  constructOutline,
  informationCircleOutline,
  addCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  checkboxOutline
} from 'ionicons/icons'

const router = useRouter()

// Données du formulaire
const modele = ref<string>('')
const pannesSelectionnees = ref<string[]>([])
const informations = ref<string>('')
const formTouched = ref<boolean>(false)
const typeVehicule = ref<string>('')

// Données chargées
const pannes = ref<Panne[]>([])
const messageStatut = ref<{ text: string; color: string }>({ text: '', color: '' })
const toastMessage = ref('')
const toastColor = ref('primary')

// Fonction pour gérer la sélection/désélection des pannes
function togglePanneSelection(event: CustomEvent, panneId: string) {
  const isChecked = event.detail.checked;
  
  if (isChecked) {
    // Ajouter la panne si elle n'est pas déjà sélectionnée
    if (!pannesSelectionnees.value.includes(panneId)) {
      pannesSelectionnees.value = [...pannesSelectionnees.value, panneId];
    }
  } else {
    // Retirer la panne si elle est décochée
    pannesSelectionnees.value = pannesSelectionnees.value.filter(id => id !== panneId);
  }
  
  console.log('Pannes sélectionnées:', pannesSelectionnees.value);
}

// Calculer si le formulaire est valide
const formValide = computed(() => {
  return modele.value.trim() !== '' && 
         pannesSelectionnees.value.length > 0 &&  
         typeVehicule.value !== '';
});

// Charger les pannes au montage du composant
onMounted(async () => {
  await chargerPannes()
})

async function chargerPannes() {
  const loading = await loadingController.create({
    message: 'Chargement des types de pannes...',
    spinner: 'crescent'
  })
  await loading.present()

  try {
    const result = await getPannes()
    if (result.success && result.data) {
      pannes.value = result.data
    } else {
      showToast('Erreur lors du chargement des pannes', 'danger')
    }
  } catch (error) {
    console.error("Erreur dans chargerPannes:", error)
    showToast('Erreur réseau', 'danger')
  } finally {
    await loading.dismiss()
  }
}

async function ajouterVoiture() {
  formTouched.value = true
  
  if (!formValide.value) {
    showToast('Veuillez remplir tous les champs obligatoires', 'warning')
    return
  }

  const loading = await loadingController.create({
    message: 'Ajout en cours...',
    spinner: 'crescent'
  })
  await loading.present()

  try {
    const user = auth.currentUser
    if (!user) {
      showToast('Veuillez vous reconnecter', 'danger')
      router.push('/auth')
      return
    }

    // Utiliser la nouvelle fonction avec pannes multiples
    const result = await ajouterVoitureAvecPannes(
      user.uid,
      user.email || '',
      modele.value.trim(),
      pannesSelectionnees.value,  // Passer un array d'IDs
      typeVehicule.value  
    );
    
    if (result.success) {
      messageStatut.value = {
        text: 'Voiture ajoutée avec succès!',
        color: 'success'
      }
      
      // Réinitialiser le formulaire
      setTimeout(() => {
        modele.value = ''
        typeVehicule.value = ''
        pannesSelectionnees.value = []  // Réinitialiser l'array
        informations.value = ''
        formTouched.value = false
        messageStatut.value = { text: '', color: '' }
        
        // Rediriger vers la liste des voitures
        router.push('/home')
      }, 1500)
    } else {
      messageStatut.value = {
        text: 'Erreur: ' + result.error,
        color: 'danger'
      }
    }
  } catch (error) {
    console.error(error)
    messageStatut.value = {
      text: 'Erreur lors de l\'ajout',
      color: 'danger'
    }
  } finally {
    await loading.dismiss()
  }
}

function annuler() {
  router.push('/home')
}

function showToast(message: string, color: string) {
  toastMessage.value = message
  toastColor.value = color
}
</script>

<style scoped>
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
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.back-btn {
  --color: var(--garage-text-light);
  --icon-color: var(--garage-text-light);
  --background-hover: rgba(255, 255, 255, 0.1);
  --border-radius: 20px;
  font-size: 14px;
}

/* Wrapper du formulaire */
.form-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  background: var(--garage-card);
  border-radius: var(--garage-radius);
  box-shadow: var(--garage-shadow);
  overflow: hidden;
  border: 1px solid var(--garage-border);
  transition: var(--garage-transition);
}

.form-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--garage-shadow-hover);
}

/* En-tête du formulaire */
.form-header {
  background: linear-gradient(135deg, var(--garage-primary) 0%, var(--garage-primary-dark) 100%);
  padding: 30px;
  text-align: center;
  color: var(--garage-text-light);
}

.form-icon {
  margin-bottom: 20px;
}

.header-icon {
  font-size: 50px;
  color: rgba(255, 255, 255, 0.9);
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.form-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

/* Contenu du formulaire */
.form-content {
  padding: 30px;
}

/* Groupes de formulaire */
.form-group {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--garage-text-main);
  margin-bottom: 8px;
}

.required {
  color: var(--garage-danger);
  margin-left: 4px;
}

.optional {
  color: var(--garage-text-main);
  opacity: 0.6;
  font-weight: 400;
  margin-left: 4px;
  font-size: 13px;
}

/* Inputs */
.input-wrapper,
.select-wrapper,
.textarea-wrapper {
  position: relative;
}

.custom-input,
.custom-select,
.custom-textarea {
  --background: var(--garage-card);
  --border-color: var(--garage-border);
  --border-radius: 12px;
  --border-width: 2px;
  --border-style: solid;
  --padding-start: 50px;
  --padding-end: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  --placeholder-color: var(--garage-text-main);
  --placeholder-opacity: 0.5;
  font-size: 15px;
  transition: var(--garage-transition);
  color: black;
}

.custom-input:focus,
.custom-select:focus,
.custom-textarea:focus {
  --border-color: var(--garage-accent);
  box-shadow: 0 0 0 3px rgba(75, 182, 183, 0.1);
}

.input-icon,
.select-icon,
.textarea-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--garage-accent);
  font-size: 20px;
  z-index: 10;
}

.textarea-icon {
  top: 20px;
  transform: none;
}

/* Textarea spécifique */
.custom-textarea {
  --padding-top: 45px;
  min-height: 120px;
  resize: vertical;
}

/* Messages */
.error-message,
.hint-message {
  display: block;
  font-size: 12px;
  margin-top: 6px;
  padding-left: 10px;
}

.error-message {
  color: var(--garage-danger);
}

.hint-message {
  color: var(--garage-text-main);
  opacity: 0.6;
}

/* Actions du formulaire */
.form-actions {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.submit-btn {
  --background: var(--garage-accent);
  --background-hover: #3da3a4;
  --background-activated: #3da3a4;
  --border-radius: 12px;
  --padding-top: 18px;
  --padding-bottom: 18px;
  --box-shadow: var(--garage-shadow);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: var(--garage-transition);
  height: 56px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--garage-shadow-hover);
}

.submit-btn:disabled {
  --background: var(--garage-primary-light);
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 22px;
  margin-right: 8px;
}

.cancel-btn {
  background: transparent;
  border: 2px solid var(--garage-border);
  color: var(--garage-text-main);
  padding: 15px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--garage-transition);
  text-align: center;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: var(--garage-primary);
}

/* Indicateur de validation */
.validation-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  border-left: 4px solid var(--garage-border);
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--garage-danger);
  transition: var(--garage-transition);
}

.indicator-dot.valid {
  background: var(--garage-accent);
}

.indicator-text {
  font-size: 13px;
  color: var(--garage-text-main);
  opacity: 0.8;
}

/* Message de statut */
.status-message {
  margin-top: 25px;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  animation: fadeIn 0.3s ease;
}

.status-message.success {
  background: rgba(67, 160, 71, 0.1);
  border: 1px solid rgba(67, 160, 71, 0.3);
  color: #2e7d32;
}

.status-message.danger {
  background: rgba(229, 57, 53, 0.1);
  border: 1px solid rgba(229, 57, 53, 0.3);
  color: #c62828;
}

.status-message.warning {
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  color: #ef6c00;
}

.status-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.status-message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    --padding-start: 16px;
    --padding-end: 16px;
    --padding-top: 16px;
  }
  
  .form-header {
    padding: 25px 20px;
  }
  
  .form-content {
    padding: 25px 20px;
  }
  
  .form-title {
    font-size: 20px;
  }
  
  .header-icon {
    font-size: 40px;
  }
  
  .custom-input,
  .custom-select,
  .custom-textarea {
    --padding-start: 45px;
    --padding-top: 14px;
    --padding-bottom: 14px;
    font-size: 14px;
  }
  
  .submit-btn {
    font-size: 15px;
    height: 52px;
  }
}

.custom-select {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
  appearance: none;
  cursor: pointer;
}

.input-wrapper {
  position: relative;
}

.input-wrapper select {
  padding-right: 40px; /* Pour l'icône */
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.pannes-checkbox-group {
  background: var(--ion-color-light);
  border-radius: 8px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.panne-checkbox-item {
  --inner-padding-end: 0;
  --padding-start: 0;
  --background: transparent;
}

.panne-checkbox-item ion-checkbox {
  margin-right: 12px;
  --size: 20px;
}

.panne-checkbox-item ion-label {
  font-size: 14px;
  color: var(--ion-color-dark);
}

@media (max-width: 480px) {
  .form-actions {
    gap: 12px;
  }
  
  .validation-indicator {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .status-message {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

<!-- Styles globaux pour les selects -->
<style>
ion-select::part(icon) {
  color: var(--garage-accent);
}

ion-select::part(text) {
  color: var(--garage-text-main);
}

ion-select::part(placeholder) {
  color: var(--garage-text-main);
  opacity: 0.5;
}
</style>