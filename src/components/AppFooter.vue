<template>
	<footer class="site-footer section">
    <div class="container">
      <div class="row">
        <div class="col-12">
          <div class="social-links">
            <a href="https://www.linkedin.com/in/picardjustin/" target="_blank" rel="noopener">LinkedIn</a><span class="star">✦</span>
            <a href="https://github.com/justinpicard" target="_blank" rel="noopener">Github</a><span class="star">✦</span>
            <a href="https://dribbble.com/justinpicard" target="_blank" rel="noopener">Dribbble</a>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="credits mt-1">
            <span class="copyright">&copy; {{ new Date().getFullYear() }} Justin Picard</span><span class="star">✦</span>
            <a href="mailto:hallo@justinpicard.nl">hallo@justinpicard.nl</a><span class="star">✦</span>
            <router-link :to="{ name: 'resume' }">My resumé</router-link>
          </div>
        </div>
      </div>
    </div>
	</footer>
</template>