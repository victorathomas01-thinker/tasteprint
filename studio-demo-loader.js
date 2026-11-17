const params = new URL(location.href).searchParams;

export function loadStudioDemo() {
  if (params.get('campaignAdmin') !== '1'
      || params.get('workspace') !== 'demo-workspace'
      || params.get('hosted') !== 'aster') return false;
  const button = document.querySelector('#load-aster');
  if (!button) return false;
  button.click();
  return true;
}
