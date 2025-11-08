import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: () => import('@/views/terminal.vue'),
        },
        {
            path: '/vnc',
            component: () => import('@/views/vnc.vue'),
        },
    ],
})

export default router