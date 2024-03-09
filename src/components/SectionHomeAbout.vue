<template>
  <section class="section about" data-scroll-speed="2" data-scroll-section>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <p class="text-xl mb-3">Hi <span class="wave">👋🏼</span> my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use.</p>
          <router-link :to="{ name: 'about' }" class="btn btn-outlined btn-light btn-md">
            <span class="btn-text-container">
              <span class="btn-text-wrapper">More about me</span>
              <span class="btn-text-wrapper">More about me</span>
            </span>
            <div class="btn-bg rounded-pill"></div>
          </router-link>
        </div>
        <div class="lead-block d-none">
          <h2>Hi 👋🏼 my name is Justin Picard and I'm a digital product designer. I love designing applications, platforms and websites that look great and are easy to use.</h2>
        </div>
      </div>
    </div>
  </section>
</template>