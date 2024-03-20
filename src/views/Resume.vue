<template>
  <header class="page-header">
    <PageTitle/>
    <div class="page-intro mt-3">
      <div class="container">
        <div class="row">
          <div class="col-8">
            <p class="text-lg">My name is Justin Picard, I currently live in Middelburg, The Netherlands and I'm a Digital Product Designer and Front-end Dev with over a decade of experience. Currently I am looking for a new opportunity to release my potential and skills as a Product/UX/UI designer.</p>
            <DownloadResumeButton :pdf-file-name="pdfFileName" :pdf-url="pdfUrl"/>
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
          <p>I am an entirely self-taught digital designer with a heavy focus on UX/UI design and webdesign. Currently I work as senior digital designer at <a href="https://elloro.nl" target="_blank" rel="noopener">Digital agency Elloro</a> and SaaS reservation management software company <a href="https://recranet.com" target="_blank" rel="noopener">Recranet</a>.</p>

           <p>My interest for digital design was sparked during my Communication & Multimedia Design education at Avans Breda (2009-2014). To develop my skills I started designing and coding websites for fun (and family & friends) in plain old HTML & CSS, and later WordPress. This resulted in me starting up my own company, and I have been designing and building websites and SaaS products since then. In the past few years my passion for product design grew as I designed and built a number of SaaS products for clients and as side projects.</p>

          <p>In my private time, I hugely enjoy going to concerts, <a href="https://open.spotify.com/user/jusenthijs?si=82eab397383f487a" target="_blank" rel="noopener">listening to music</a>, working out at the gym, playing basketball and travel the world. Besides that, I am a huge Formula 1 fan, a sci-fi geek and plant dad. I live together with my partner and our two cats in the city center of Middelburg.</p>

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
          <h2 class="lead-heading">Work experience</h2>
        </div>
        <div class="col-6">
          <div class="resume-list">
            <div class="resume-list-item">
              <span class="period">Aug 2021 - Now</span>
              <span class="role">Senior Digital Designer at Elloro | Growth Agency</span>
              <span class="industry byline">Agency<span class="star">✦</span>Notable clients: MR Group, HZ University, Groep De Hoop</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Aug 2021 - Now</span>
              <span class="role">Senior Digital Designer at Recranet | Growth Agency</span>
              <span class="industry byline">Reservation management software<span class="star">✦</span>Notable clients: Vodatent, Walcheren Vakanties, Parador Vakantieparken</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Jan 2019 - Jan 2023</span>
              <span class="role">Founder & author at wpsimpel.nl</span>
              <span class="industry byline">Side project<span class="star">✦</span>WordPress tutorials & resources blog</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Apr 2021 - Jul 2021</span>
              <span class="role">Co-founder & lead designer at Boldr • Digital Agency</span>
              <span class="industry byline">Digital Agency</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Sep 2017 - Jul 2021</span>
              <span class="role">Co-founder & lead designer at Dondr ⚡ Web & design</span>
              <span class="industry byline">Digital Agency<span class="star">✦</span>Notable clients: Provincie Zeeland, SFV<i>online</i>, Archipel Scholen</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Oct 2017 - Sep 2018</span>
              <span class="role">Co-founder & lead designer at Jibbie</span>
              <span class="industry byline">Activity booking software for kindergartens</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Jul 2014 - Aug 2017</span>
              <span class="role">Freelance webdesigner & WordPress specialist</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Sep 2013 - Jan 2014</span>
              <span class="role">Internship web design & motion graphics at Nedbase | Digital Agency</span>
              <span class="industry byline">Digital Agency<span class="star">✦</span>Notable clients: Delta, Rijkswaterstaat, Film By The Sea</span>
            </div>
            <div class="resume-list-item">
              <span class="period">Oct 2012 - Feb 2014</span>
              <span class="role">Creative developer at Z2 Design</span>
              <span class="industry byline">Digital Agency</span>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="divider mt-3 mb-3"></div>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <h2 class="lead-heading">Relevant Education</h2>
        </div>
        <div class="col-6">
          <div class="resume-list">
            <div class="resume-list-item">
              <span class="period">Aug 2010 - Jan 2015</span>
              <span class="role">HBO Bachelor of ICT</span>
              <span class="industry byline">Communication & Multimedia Design<span class="star">✦</span>Avans Hogeschool, Breda</span>
            </div>
            <div class="resume-list-item">
              <span class="period">2014</span>
              <span class="role">Minor Social Media Design</span>
              <span class="industry byline">Communication<span class="star">✦</span>HZ University, Vlissingen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import PageTitle from "../components/PageTitle.vue";
import DownloadResumeButton from "../components/buttons/DownloadResumeButton.vue";

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

<script>
import DownloadResumeButton from "../components/buttons/DownloadResumeButton.vue";
export default {
  name: 'MyProject',
  components: {
    DownloadResumeButton
  },
  data() {
    return {
      pdfUrl: '/path/to/my/file.pdf',
      pdfFileName: 'my-pdf-file.pdf'
    };
  }
};
</script>