import { createRouter, createWebHashHistory } from 'vue-router'
import AlbumView from '@renderer/views/AlbumView.vue'
import SettingsView from '@renderer/views/SettingsView.vue'
import AboutView from '@renderer/views/AboutView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/album'
    },
    {
      path: '/album',
      name: 'album',
      component: AlbumView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    }
  ]
})
