<template>
  <ion-page>
    <ion-content fullscreen class="login-register-container">
      <div class="centered-container">
        <div class="container" :class="{ 'right-panel-active': isRegisterMode }" id="container">
          
          <!-- Formulaire d'inscription -->
          <div class="form-container register-container">
            <form @submit.prevent="handleSignUp">
                <br>
              <h1>Inscrivez-vous ici</h1>
              
              <div class="form-control">
                <input 
                  type="text" 
                  id="username" 
                  v-model="registerData.displayName"
                  placeholder="Nom complet"
                  required
                  @input="validateRegisterName"
                />
                <small v-if="registerErrors.displayName" id="username-error">
                  {{ registerErrors.displayName }}
                </small>
                <span></span>
              </div>
              
              <div class="form-control">
                <input 
                  type="email" 
                  id="email" 
                  v-model="registerData.email"
                  placeholder="Email"
                  required
                  @input="validateRegisterEmail"
                />
                <small v-if="registerErrors.email" id="email-error">
                  {{ registerErrors.email }}
                </small>
                <span></span>
              </div>
              
              <div class="form-control password-field">
                <input 
                  :type="showRegisterPassword ? 'text' : 'password'"
                  id="password" 
                  v-model="registerData.password"
                  placeholder="Mot de passe"
                  required
                  @input="validateRegisterPassword"
                />
                <button 
                  type="button" 
                  class="toggle-password"
                  @click="toggleRegisterPassword"
                  tabindex="-1"
                >
                  <ion-icon :icon="showRegisterPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
                <small v-if="registerErrors.password" id="password-error">
                  {{ registerErrors.password }}
                </small>
                <span></span>
              </div>
              
              <button type="submit" class="submit-btn" :disabled="isLoading">
                <span v-if="!isLoading">S'inscrire</span>
                <ion-spinner v-else name="crescent"></ion-spinner>
              </button>
              
              <span class="separator">ou utilisez votre compte</span>
              
              <div class="social-container">
                <a href="#" class="social" @click.prevent="handleGoogleSignIn">
                  <ion-icon :icon="logoGoogle"></ion-icon>
                </a>
              </div>

              <!-- Lien de switch mobile -->
              <p class="mobile-switch-link" @click="switchToLogin">
                Déjà inscrit ? <span>Se connecter</span>
              </p>
            </form>
          </div>

          <!-- Formulaire de connexion -->
          <div class="form-container login-container">
            <form @submit.prevent="handleSignIn" class="form-lg">
                <br>
              <h1>Connectez-vous ici</h1>
              
              <div class="form-control">
                <input 
                  type="email" 
                  class="email-2" 
                  v-model="loginData.email"
                  placeholder="Email"
                  required
                  @input="validateLoginEmail"
                />
                <small v-if="loginErrors.email" class="email-error-2">
                  {{ loginErrors.email }}
                </small>
                <span></span>
              </div>
              
              <div class="form-control password-field">
                <input 
                  :type="showLoginPassword ? 'text' : 'password'"
                  class="password-2" 
                  v-model="loginData.password"
                  placeholder="Mot de passe"
                  required
                  @input="validateLoginPassword"
                />
                <button 
                  type="button" 
                  class="toggle-password"
                  @click="toggleLoginPassword"
                  tabindex="-1"
                >
                  <ion-icon :icon="showLoginPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
                <small v-if="loginErrors.password" class="password-error-2">
                  {{ loginErrors.password }}
                </small>
                <span></span>
              </div>
              
              <button type="submit" class="submit-btn" :disabled="isLoading">
                <span v-if="!isLoading">Se connecter</span>
                <ion-spinner v-else name="crescent"></ion-spinner>
              </button>
              
              <span class="separator">ou utilisez votre compte</span>
              
              <div class="social-container">
                <a href="#" class="social" @click.prevent="handleGoogleSignIn">
                  <ion-icon :icon="logoGoogle"></ion-icon>
                </a>
              </div>

              <!-- Lien de switch mobile -->
              <p class="mobile-switch-link" @click="switchToRegister">
                Pas encore de compte ? <span>S'inscrire</span>
              </p>
            </form>
          </div>

          <!-- Overlay avec animation -->
          <div class="overlay-container">
            <div class="overlay">
              <div class="overlay-panel overlay-left">
                <h1 class="title">
                  Déjà <br />
                  client ?
                </h1>
                <p>Si vous avez déjà un compte, connectez-vous ici</p>
                <button class="ghost" id="login" @click="switchToLogin">
                  Se connecter
                </button>
              </div>

              <div class="overlay-panel overlay-right">
                <h1 class="title">
                  Nouveau <br />
                  client ?
                </h1>
                <p>Inscrivez-vous et commencez à gérer vos voitures</p>
                <button class="ghost" id="register" @click="switchToRegister">
                  S'inscrire
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message d'erreur global -->
      <ion-toast
        :is-open="!!errorMessage"
        :message="errorMessage"
        :duration="5000"
        @didDismiss="errorMessage = ''"
        color="danger"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast
} from '@ionic/vue';
import { 
  logoGoogle,
  arrowBack,
  arrowForward,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';
import { signUp, signIn, signInWithGoogle } from '@/services/authService';

const router = useRouter();

// États
const isRegisterMode = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const rememberMe = ref(false);
const isMobile = ref(false);
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);

// Vérifier la taille de l'écran
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

// Toggle password visibility
const toggleLoginPassword = () => {
  showLoginPassword.value = !showLoginPassword.value;
};

const toggleRegisterPassword = () => {
  showRegisterPassword.value = !showRegisterPassword.value;
};

// Données des formulaires
const loginData = reactive({
  email: '',
  password: ''
});

const registerData = reactive({
  displayName: '',
  email: '',
  password: ''
});

// Erreurs de validation
const loginErrors = reactive({
  email: '',
  password: ''
});

const registerErrors = reactive({
  displayName: '',
  email: '',
  password: ''
});

// Fonctions pour changer de mode
const switchToRegister = () => {
  isRegisterMode.value = true;
  if (isMobile.value) {
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
  }
};

const switchToLogin = () => {
  isRegisterMode.value = false;
  if (isMobile.value) {
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
  }
};

// Validation des champs
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validateRegisterEmail = () => {
  if (!validateEmail(registerData.email)) {
    registerErrors.email = "Email invalide";
  } else {
    registerErrors.email = "";
  }
};

const validateLoginEmail = () => {
  if (!validateEmail(loginData.email)) {
    loginErrors.email = "Email invalide";
  } else {
    loginErrors.email = "";
  }
};

const validateRegisterPassword = () => {
  if (registerData.password.length < 6) {
    registerErrors.password = "Minimum 6 caractères";
  } else if (registerData.password.length > 20) {
    registerErrors.password = "Maximum 20 caractères";
  } else {
    registerErrors.password = "";
  }
};

const validateLoginPassword = () => {
  if (loginData.password.length < 6) {
    loginErrors.password = "Minimum 6 caractères";
  } else if (loginData.password.length > 20) {
    loginErrors.password = "Maximum 20 caractères";
  } else {
    loginErrors.password = "";
  }
};

const validateRegisterForm = () => {
  let isValid = true;
  
  if (!registerData.displayName.trim()) {
    registerErrors.displayName = "Le nom est requis";
    isValid = false;
  } else {
    registerErrors.displayName = "";
  }
  
  validateRegisterEmail();
  validateRegisterPassword();
  
  if (!registerData.email || !registerData.password) {
    isValid = false;
  }
  
  return isValid;
};

const validateLoginForm = () => {
  let isValid = true;
  
  validateLoginEmail();
  validateLoginPassword();
  
  if (!loginData.email || !loginData.password) {
    isValid = false;
  }
  
  return isValid;
};

// Gestion des soumissions
const handleSignIn = async () => {
  if (!validateLoginForm()) {
    errorMessage.value = "Veuillez corriger les erreurs dans le formulaire";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  const result = await signIn(loginData.email, loginData.password);
  
  if (result.success) {
    router.push('/home');
  } else {
    errorMessage.value = result.error || "Erreur de connexion";
  }
  
  isLoading.value = false;
};

const handleSignUp = async () => {
  if (!validateRegisterForm()) {
    errorMessage.value = "Veuillez corriger les erreurs dans le formulaire";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  const result = await signUp(
    registerData.email, 
    registerData.password, 
    registerData.displayName
  );
  
  if (result.success) {
    router.push('/home');
  } else {
    errorMessage.value = result.error || "Erreur d'inscription";
  }
  
  isLoading.value = false;
};

const handleGoogleSignIn = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  const result = await signInWithGoogle();
  
  if (result.success) {
    router.push('/home');
  } else {
    errorMessage.value = result.error || "Erreur avec Google Sign-In";
  }
  
  isLoading.value = false;
};

// Fonction pour valider le nom
const validateRegisterName = () => {
  if (registerData.displayName.length < 3) {
    registerErrors.displayName = "Minimum 3 caractères";
  } else if (registerData.displayName.length > 30) {
    registerErrors.displayName = "Maximum 30 caractères";
  } else {
    registerErrors.displayName = "";
  }
};
</script>

<style scoped>
@import '@/theme/neumorph.css';

/* Styles spécifiques pour Ionic dans ce composant */
ion-content {
  --background: var(--garage-bg);
}

ion-icon {
  font-size: 18px;
}

ion-spinner {
  width: 20px;
  height: 20px;
  color: white;
}

button.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

button.submit-btn:disabled:hover {
  letter-spacing: 1px;
}

.social-container ion-icon {
  font-size: 20px;
}

/* Styles pour les liens de switch mobile */
.mobile-switch-link {
  display: none;
  font-size: 14px;
  color: var(--garage-text-main);
  margin-top: 20px;
  text-align: center;
  cursor: pointer;
}

.mobile-switch-link span {
  color: var(--garage-accent);
  font-weight: 600;
  text-decoration: underline;
}

.mobile-switch-link:hover span {
  color: var(--garage-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .mobile-switch-link {
    display: block;
  }
  
  .overlay-container {
    display: none;
  }
}
</style>

<style>
/* Styles globaux pour les champs mot de passe */
.password-field {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--garage-text-main);
  opacity: 0.6;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.toggle-password:hover {
  opacity: 1;
}

.toggle-password:focus {
  outline: none;
  opacity: 1;
}

.toggle-password ion-icon {
  font-size: 20px;
}

/* Ajustement de l'input pour faire de la place au bouton */
.password-field input {
  padding-right: 40px !important;
}
</style>