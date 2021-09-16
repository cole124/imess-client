import Router from 'vue-router'
import Vue from 'vue'
import Messages from '@/views/Messages';
Vue.use(Router)

const router = new Router({
    mode: 'hash',
    routes: [
        {
            path: '/Test/:pg?',
            props: true,
            component: () => import(/* webpackPrefetch: true */'@/views/Test.vue'),
        },
        {
            path: '/',
            component: Messages,
            name: 'Messages',
            children: [
                {
                    path: ':chatId/:message_id?',
                    props: true,
                    component: () => import(/* webpackPrefetch: true */'@/components/MessageGrid.vue'),
                }
            ]
        },
        {
            path: '/Person/:personId/Attachments/:pg?',
            props: true,
            component: () => import(/* webpackPrefetch: true */'@/views/Attachments-Paged.vue'),
        }

    ]
})

export default router