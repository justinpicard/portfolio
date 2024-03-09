<template>
  <header class="page-header">
    <PageTitle/>
    <div class="page-intro mt-3">
      <div class="container">
        <div class="row">
          <div class="col-8">
            <p class="text-lg">My name is Justin Picard, I currently live in Middelburg, The Netherlands and I'm a Digital Product Designer and Front-end Dev with over a decade of experience. Currently I am looking for a new opportunity to release my potential and skills as a Product/UX/UI designer.</p>
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="resume">
    <div class="container">
      <div class="row">
        <div class="col-12">
          <div class="divider mt-3 mb-3"></div>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <h2 class="lead-heading">About</h2>
        </div>
        <div class="col-6">
          <p>I am an entirely self-taught digital designer with a heavy focus on product design and webdesign. I work as senior digital designer at <a href="https://elloro.nl" target="_blank" rel="noopener">Digital agency Elloro</a> and reservation management software company <a href="https://recranet.com" target="_blank" rel="noopener">Recranet</a>.</p>

           <p>My interest for digital design was sparked during my Communication & Multimedia Design education at Avans Breda (2009-2014). Back in the days I started designing and coding websites for fun (and family & friends). I have a broad experience with designing and building my own WordPress themes and plugins for clients, and recently I started working on some side projects (and this website), exploring VueJS. In the recent past I built and authored a side project called WPsimpel, a WordPress blog about WordPress tutorials, tips and news.</p>

          <p>In my private time, I hugely enjoy going to concerts, <a href="https://open.spotify.com/user/jusenthijs?si=82eab397383f487a" target="_blank" rel="noopener">listening to music</a>, working out, playing basketball and travel the world. Besides that, I am a huge Formula 1 fan, a sci-fi geek and plant dad. I live together with the love of my life and our two cats in the city center of Middelburg.</p>

          <p>Want to see and know more of me? You can find me on <a href="https://www.linkedin.com/in/picardjustin/" target="_blank" rel="noopener">LinkedIn</a>, <a href="https://github.com/justinpicard" target="_blank" rel="noopener">Github</a> and <a href="https://dribbble.com/justinpicard" target="_blank" rel="noopener">Dribbble</a>.</p>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="row">
        <div class="col-12">
          <div class="divider mt-3 mb-3"></div>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <h2 class="lead-heading">Resumé</h2>
        </div>
        <div class="col-6">
          <div class="resume-list">
            <div class="resume-list-item">
              <span class="period">Aug 2021 - Now</span>
              <span class="role">Senior Digital Designer at Elloro | Growth Agency</span>
              <span class="industry">Agency ✦ Notable clients: MR Group, HZ University, Groep De Hoop</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Aug 2021 - Now</span>
              <span class="role">Senior Digital Designer at Recranet | Growth Agency</span>
              <span class="industry">Reservation management software ✦ Notable clients: Vodatent, Walcheren Vakanties, Parador Vakantieparken</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Jan 2019 - Jan 2023</span>
              <span class="role">Founder & author at wpsimpel.nl</span>
              <span class="industry">Side project ✦ WordPress tutorials & resources blog</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Apr 2021 - Jul 2021</span>
              <span class="role">Co-founder & lead designer at Boldr • Digital Agency</span>
              <span class="industry">Digital Agency</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Sep 2017 - Jul 2021</span>
              <span class="role">Co-founder & lead designer at Dondr ⚡ Web & design</span>
              <span class="industry">Digital Agency ✦ Notable clients: Provincie Zeeland, SFV<i>online</i>, Archipel Scholen</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Oct 2017 - Sep 2018</span>
              <span class="role">Co-founder & lead designer at Jibbie</span>
              <span class="industry">Activity booking software for kindergartens</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Jul 2014 - Aug 2017</span>
              <span class="role">Freelance webdesigner & WordPress specialist</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Sep 2013 - Jan 2014</span>
              <span class="role">Internship web design & motion graphics at Nedbase | Digital Agency</span>
              <span class="industry">Digital Agency ✦ Notable clients: Delta, Rijkswaterstaat, Film By The Sea</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Oct 2012 - Feb 2014</span>
              <span class="role">Creative developer at Z2 Design</span>
              <span class="industry">Digital Agency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import PageTitle from "../components/PageTitle.vue";

// function calculateAge(dateOfBirth)
// {
//   const now = new Date();
//   const diff = Math.abs(now - dateOfBirth);
//   const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
//   return age;
// }
// const age = calculateAge(new Date('1987-02-17')); // replace with user's date of birth
// console.log(age); // outputs the user's age in years
</script>