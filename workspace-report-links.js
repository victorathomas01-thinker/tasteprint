const params = new URL(location.href).searchParams;
if (params.get('workspace') === '1') {
  const decorate = () => {
    const workspaceId = window.TasteprintWorkspace?.selected?.()?.id || '';
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(workspaceId)) return;
    document.querySelectorAll('.workspace-shell a[href^="?campaignReport="]').forEach((anchor) => {
      const url = new URL(anchor.getAttribute('href'), location.href);
      url.searchParams.set('workspace', workspaceId);
      anchor.href = url.toString();
    });
  };
  const observer = new MutationObserver(() => requestAnimationFrame(decorate));
  observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
  requestAnimationFrame(decorate);
}
