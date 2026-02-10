// Dans votre fichier de routes
import { createRouter, createWebHistory } from '@ionic/vue-router';
import AuthPage from '@/views/AuthPage.vue';
import HomePage from '@/views/HomePage.vue';
import Ajouter_voiture from '@/views/Ajouter_voiture.vue';
import Paiement from '@/views/Paiement.vue';

const routes = [
  {
    path: '/',
    redirect: '/auth'
  },
  {
    path: '/paiement',
    name: 'Paiement',
    component: Paiement
  },
  {
    path: '/ajouter-voiture',
    component: Ajouter_voiture
  },
  {
    path: '/auth',
    name: 'Auth',
    component: AuthPage
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});



export default router;