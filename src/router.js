import { createWebHistory, createRouter } from "vue-router";

const routes = [
    {
        path: "/",
        name: "home",
        meta: { title: 'Justin Picard' },
        component: () => import('./views/Home.vue')
    },
    {
        path: "/home",
        redirect: "/"
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