import { createWebHistory, createRouter } from "vue-router";
import Index from "./views/Index.vue";

const routes = [
    {
        path: "/",
        name: "home",
        meta: { title: 'Justin Picard ✦ Digital Product Designer' },
        component: Index
    },
    {
        path: "/home",
        redirect: "/"
    },
	{
        path: "/resume",
		name: "resume",
        meta: { title: 'My resume' },
        component: () => import('./views/Resume.vue')
    },
    {
        path: "/:catchall(.*)*",
        name: "404notfound",
        meta: { title: '404 — Page not found' },
        component: () => import('./views/404.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // always scroll to top
        return { top: 0 }
    },
});

export default router;
