const params = new URL(location.href).searchParams;
const DEMO_ASTER = params.get('campaignAdmin') === '1'
  && params.get('workspace') === 'demo-workspace'
  && params.get('hosted') === 'aster';

if (DEMO_ASTER) {
  let attempts = 0;
  const load = () => {
    attempts += 1;
    const button = document.querySelector('#load-aster');
    if (button) {
      button.click();
      const status = document.querySelector('[data-studio-workspace-status]');
      if (status) status.textContent = 'Loaded the fictional Aster & Tide campaign for the local Workspace demo. Nothing was fetched from a backend.';
      return;
    }
    if (attempts < 20) setTimeout(load, 75);
  };
  load();
}
