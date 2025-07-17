<template>
  <AppHeader />
	<PageTitle/>
  <div class="page-intro mt-3 text-lg">
    <div class="container">
      <div class="row">
        <div class="col-10">MAKE THIS A BLUE SCREEN OF DEATH WITH A FUNNY TWIST
          Whoops! Looks like this page doesn't exist (anymore) 😰<br/>Go back to the <router-link :to="{ name: 'home' }">homepage</router-link>.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageTitle from "../components/PageTitle.vue";
import AppHeader from "../components/AppHeader.vue";
</script>