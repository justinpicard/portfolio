<template>
	<footer class="site-footer section">
    <div class="container">
      <div class="social">
        <span class="credits">&copy; {{ new Date().getFullYear() }} Justin Picard</span><span class="star">✦</span>
        <a href="mailto:hallo@justinpicard.com">hallo@justinpicard.com</a><span class="star">✦</span>
        <a href="https://www.linkedin.com/in/picardjustin/" target="_blank" rel="noopener">LinkedIn</a><span class="star">✦</span>
        <a href="https://github.com/justinpicard" target="_blank" rel="noopener">Github</a><span class="star">✦</span>
        <a href="https://dribbble.com/justinpicard" target="_blank" rel="noopener">Dribbble</a><span class="star">✦</span>
        <router-link :to="{ name: 'resume' }">My resumé</router-link>
      </div>
    </div>
	</footer>
</template>