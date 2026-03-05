import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Future: load shared assets here
  }

  create() {
    const route = (window as any).__PAPER_ROUTE__;
    if (route) {
      this.scene.start(route.scene, route.data);
    }
    // If no route (Vue page is active), do nothing — App.vue handles it
  }
}
