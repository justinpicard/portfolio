<template>
  <header class="page-header">
    <PageTitle/>
    <div class="page-intro mt-3">
      <div class="container">
        <div class="row">
          <div class="col-8">
            <p class="text-lg">My name is Justin Picard, I currently live in Middelburg, The Netherlands and I'm a digital product designer and front-end dev with over a decade of experience.</p>
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="resume">
    <div class="container">
      <div class="row">
        <div class="col-6">
          <p>I am an entirely self-taught digital designer with a heavy focus on product design and webdesign. I work as senior digital designer at <a href="https://elloro.nl" target="_blank" rel="noopener">Digital agency Elloro</a> and reservation management software company <a href="https://recranet.com" target="_blank" rel="noopener">Recranet</a>.</p>

          <p>My interest for digital design was sparked during my Communication & Multimedia Design education at Avans Breda (2009-2014). Back in the days I started designing and coding websites for fun (and family & friends). I have a broad experience with designing and building my own WordPress themes and plugins for clients, and recently I started working on some side projects (and this website), exploring VueJS. In the recent past I built and authored a side project called WPsimpel, a WordPress blog about WordPress tutorials, tips and news.</p>

          <p>In my private time, I hugely enjoy going to concerts, <a href="https://open.spotify.com/user/jusenthijs?si=82eab397383f487a" target="_blank" rel="noopener">listening to music</a>, working out, playing basketball and travel the world. Besides that, I am a huge Formula 1 fan, a sci-fi geek and plant dad. I live together with the love of my life and our two cats in the city center of Middelburg.</p>

          <p>Want to see and know more of me? You can find me on <a href="https://www.linkedin.com/in/picardjustin/" target="_blank" rel="noopener">LinkedIn</a>, <a href="https://github.com/justinpicard" target="_blank" rel="noopener">Github</a> and <a href="https://dribbble.com/justinpicard" target="_blank" rel="noopener">Dribbble</a>.</p>
        </div>
        <div class="col-6">
          <figure>
            <img :src="getImageUrl('justin-picard','jpg')" alt="">
          </figure>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import PageTitle from "../components/PageTitle.vue";
function getImageUrl(name, ext) {
  return new URL(`../assets/images/${name}.${ext}`, import.meta.url).href
}
</script>