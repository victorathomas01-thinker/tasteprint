const params = new URL(location.href).searchParams;

async function loadAdvancedRoute() {
  if (params.get('campaignReport')?.trim()) {
    await import('./campaign-report.js');
  }
  if (params.get('campaignAdmin') === '1') {
    await import('./campaign-admin.js');
    const { loadStudioDemo } = await import('./studio-demo-loader.js');
    const loadedDemo = loadStudioDemo();
    await import('./studio-workspace-bridge.js');
    const status = document.querySelector('[data-studio-workspace-status]');
    if (loadedDemo && status) {
      status.textContent = 'Loaded the fictional Aster & Tide campaign for the local Workspace demo.';
    }
  }
}

loadAdvancedRoute().catch(() => {
  const status = document.querySelector('#a11y-status');
  if (status) status.textContent = 'The advanced demo could not load. Reload to try again.';
});
