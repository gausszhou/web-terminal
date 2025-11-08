import { createRouter, createWebHistory } from 'vue-router'
import TerminalPortal from '../views/terminal.vue'
import VNCViewer from '../views/vnc.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: TerminalPortal,
        },
        {
            path: '/vnc',
            component: VNCViewer,
        },
    ],
})

export default router