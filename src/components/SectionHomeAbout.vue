<template>
  <section class="section about" data-scroll-speed="2" data-scroll-section>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <p class="text-xl mb-3">Hi <span class="wave">👋🏼</span> my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use.</p>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <router-link :to="{ name: 'about' }" class="btn btn-outlined btn-light btn-md">
              <span class="btn-text-container">
                <span class="btn-text-wrapper">More about me</span>
                <span class="btn-text-wrapper">More about me</span>
              </span>
            <div class="btn-bg rounded-pill"></div>
          </router-link>
          <router-link :to="{ name: 'resume' }" class="btn btn-outlined btn-light btn-md ml-1">
              <span class="btn-text-container">
                <span class="btn-text-wrapper">Read my resumé</span>
                <span class="btn-text-wrapper">Read my resumé</span>
              </span>
            <div class="btn-bg rounded-pill"></div>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>