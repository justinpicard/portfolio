import { createWebHistory, createRouter } from "vue-router";

const routes = [
    {
        path: "/",
        name: "home",
        meta: { title: 'Justin Picard ✦ Digital Product Designer' },
        component: () => import('./views/Home.vue')
    },
    {
        path: "/home",
        redirect: "/"
    },
    {
        path: "/about",
        name: "about",
        meta: { title: 'Digital Product Designer' },
        component: () => import('./views/About.vue')
    },
    {
        path: "/resume",
        name: "resume",
        meta: { title: 'Resumé' },
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
    history: createWebHistory(import.meta.env.Base_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // always scroll to top
        return { top: 0 }
    },
});

export default router;