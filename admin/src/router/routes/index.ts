import type { CustomRoute, ElegantConstRoute, ElegantRoute, GeneratedRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [];

const appRoutes: GeneratedRoute[] = [
  {
    name: 'flash-manage',
    path: '/flash-manage',
    component: 'layout.base$view.flash-manage',
    meta: {
      title: '闪照管理',
      icon: 'mdi:image-multiple',
      order: 10
    }
  },
  {
    name: 'user-manage',
    path: '/user-manage',
    component: 'layout.base$view.user-manage',
    meta: {
      title: '用户管理',
      icon: 'mdi:account-group',
      order: 11
    }
  },
  {
    name: 'sys-config',
    path: '/sys-config',
    component: 'layout.base$view.sys-config',
    meta: {
      title: '系统配置',
      icon: 'mdi:cog-outline',
      order: 20
    }
  }
];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes, ...appRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return transformElegantRoutesToVueRoutes(routes, layouts, views);
}
