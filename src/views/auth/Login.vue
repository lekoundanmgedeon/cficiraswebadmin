<template>
  <div class="container-scroller">
    <div class="container-fluid page-body-wrapper full-page-wrapper">
      <div class="content-wrapper d-flex align-items-stretch auth auth-img-bg">
        <div class="row flex-grow">
          <div class="col-lg-6 d-flex align-items-center justify-content-center">
            <div class="auth-form-transparent text-left p-3">
              <div class="brand-logo">
                <img src="/img/photo-format.ico" alt="logo" />
              </div>
              <h4>Bienvenue !</h4>
              <h6 class="font-weight-light">Ravi de vous revoir !</h6>
              <form class="pt-3">
                <div class="form-group">
                  <label for="exampleInputEmail">Email/username</label>
                  <div class="input-group">
                    <div class="input-group-prepend bg-transparent">
                      <span class="input-group-text bg-transparent border-right-0">
                        <i class="mdi mdi-account-outline text-primary"></i>
                      </span>
                    </div>
                    <input
                      v-model="credentials.email"
                      type="text"
                      class="form-control form-control-lg border-left-0"
                      id="exampleInputEmail"
                      placeholder="Username"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword">Mot de passe</label>
                  <div class="input-group">
                    <div class="input-group-prepend bg-transparent">
                      <span class="input-group-text bg-transparent border-right-0">
                        <i class="mdi mdi-lock-outline text-primary"></i>
                      </span>
                    </div>
                    <input
                      type="password"
                      class="form-control form-control-lg border-left-0"
                      id="exampleInputPassword"
                      placeholder="Password"
                      v-model="credentials.password"
                    />
                  </div>
                </div>
                <div class="my-2 d-flex justify-content-between align-items-center">
                  <div class="form-check">
                    <label class="form-check-label text-muted">
                      <input type="checkbox" class="form-check-input" />
                      Souvenir de moi
                    </label>
                  </div>
                  <a href="#" class="auth-link text-black">Mot de passe oublié ?</a>
                </div>
                <div class="my-3">
                  <button
                    @click.prevent="handleLogin"
                    class="btn btn-block btn-primary btn-lg font-weight-medium auth-form-btn"
                  >
                    Connexion
                  </button>
                </div>
                <div class="text-center mt-4 font-weight-light">
                  Vous n'avez pas de compte ?
                  <a href="/auth/register" class="text-primary">soummettre</a>
                </div>
              </form>
            </div>
          </div>
          <div class="col-lg-6 login-half-bg d-flex flex-row">
            <p class="text-white font-weight-medium text-center flex-grow align-self-end">
              Copyright &copy; 2025 All rights reserved.
            </p>
          </div>
        </div>
      </div>
      <!-- content-wrapper ends -->
    </div>
    <!-- page-body-wrapper ends -->
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/authStore';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const credentials = ref({ email: '', password: '' });

const handleLogin = async () => {
  const success = await authStore.loginUser(credentials.value);
  if (!success) return;

  // Le guard de navigation dépose la page demandée dans `redirect` quand un
  // utilisateur non connecté tente d'y accéder : on l'y ramène après connexion.
  const redirect = /** @type {string|undefined} */ (route.query.redirect);
  router.push(redirect ?? '/dashboard');
};
</script>
