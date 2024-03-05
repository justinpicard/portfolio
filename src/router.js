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
        meta: { title: 'About' },
        component: () => import('./views/About.vue')
    },
    {
        path: "/cv",
        name: "cv",
        meta: { title: 'CV' },
        component: () => import('./views/Cv.vue')
    },
    {
        path: "/:catchall(.*)*",
        name: "404notfound",
        component: () => import('./views/404.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.Base_URL),
    routes,
});

export default router;