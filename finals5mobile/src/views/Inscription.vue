<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <h2 style="text-align: center;">Bienvenue sur notre garage</h2>
        <h5 style="text-align: center;">Pour commencer, veuillez vous inscrire</h5>

        <br><br>

        <!-- Formulaire Email/Password -->
        <ion-item>
          <ion-label position="floating">Email</ion-label>
          <ion-input v-model="email" type="email"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Mot de passe</ion-label>
          <ion-input v-model="password" type="password"></ion-input>
        </ion-item>

        <ion-button expand="block" @click="handleSignUp" fill="outline">
          S'inscrire
        </ion-button>

        <div class="divider">
          <span>OU</span>
        </div>

        <ion-button expand="block" @click="handleGoogleSignIn" color="danger">
          <ion-icon :icon="logoGoogle" slot="start"></ion-icon>
          Continuer avec Google
        </ion-button>

        <br><br>
        <ion-item>
            <ion-label>Vous avez deja un compte?</ion-label>
            <a href="/login">Se connecter</a>
        </ion-item>

        <!-- Message d'erreur -->
        <ion-text color="danger" v-if="errorMessage">
          <p>{{ errorMessage }}</p>
        </ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/vue';
import { logoGoogle } from 'ionicons/icons';
import { signUp, signInWithGoogle } from '@/services/authService';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');

const handleSignUp = async () => {
  errorMessage.value = '';
  const result = await signUp(email.value, password.value);
  
  if (result.success) {
    router.push('/home');
  } else {
    errorMessage.value = result.error;
  }
};

const handleGoogleSignIn = async () => {
  errorMessage.value = '';
  const result = await signInWithGoogle();
  
  if (result.success) {
    router.push('/home');
  } else {
    errorMessage.value = result.error;
  }
};
</script>

<style scoped>
.login-container {
  background: var(--garage-card);
  padding: 40px 30px;
  border-radius: var(--garage-radius);
  box-shadow: var(--garage-shadow);
  max-width: 420px;
  margin: 40px auto;
  border: 1px solid var(--garage-border);
}

.login-container h2 {
  font-weight: 700;
  color: var(--garage-text-light);
  margin-bottom: 5px;
}

.login-container h5 {
  color: var(--garage-text-light);
  font-weight: 400;
  margin-bottom: 30px;
}

ion-item {
  --background: transparent;
  --border-radius: 12px;
  --border-color: var(--garage-border);
  margin-bottom: 15px;
}

ion-input {
  font-size: 15px;
}

ion-button {
  --border-radius: 14px;
  height: 52px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.divider {
  text-align: center;
  margin: 25px 0;
  position: relative;
}

.divider span {
  background: var(--garage-card);
  padding: 0 12px;
  font-size: 13px;
  color: var(--garage-text-light);
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--garage-border);
  z-index: -1;
}

a {
  color: var(--garage-primary);
  font-weight: 600;
  text-decoration: none;
}

</style>