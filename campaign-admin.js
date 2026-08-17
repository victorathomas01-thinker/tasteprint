import {
  getCampaign,
  listCampaigns,
  listPublishedCampaigns,
  refreshPublishedCampaign,
  saveCampaignDraft,
  deleteCampaignDraft,
  validateCampaignManifest
} from './campaign-config.js';
import {
  REMOTE_CAMPAIGNS_ENABLED,
  publishCampaign,
  unpublishCampaign
} from './campaign-remote.js';
import {
  parseCatalogText,
  validateCatalog,
  catalogToCSV,
  catalogTemplateCSV
} from './campaign-import.js';

const params = new URL(location.href).searchParams;
const ADMIN_MODE = params.get('campaignAdmin') === '1';
if (!ADMIN_MODE) {
  // Keep this module inert on the consumer experience.
} else {
  const app = document.querySelector('#app');
  let catalog = [];
  let lastFilename = '';
  let publishedCampaigns = [];

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function download(name, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function safeId(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  }

  function rgbaFromHex(hex, alpha) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!match) return `rgba(91,140,255,${alpha})`;
    const value = match[1];
    const r = parseInt(value.slice(0,2), 16);
    const g = parseInt(value.slice(2,4), 16);
    const b = parseInt(value.slice(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function formValue(name) {
    return app.querySelector(`[name="${name}"]`)?.value?.trim() || '';
  }

  function currentManifest() {
    const accent = formValue('accent') || '#5b8cff';
    const id = safeId(formValue('id'));
    return {
      id,
      name: formValue('name'),
      label: formValue('label') || `${formValue('name')} × Tasteprint`,
      description: formValue('description'),
      localDraft: true,
      theme: {
        accent,
        accentSoft: rgbaFromHex(accent, .16),
        accentMid: rgbaFromHex(accent, .32),
        heroGlow: rgbaFromHex(accent, .22)
      },
      copy: {
        title: formValue('title'),
        lede: formValue('lede'),
        start: formValue('start') || 'Find my match',
        resultEyebrow: formValue('resultEyebrow') || 'Your matched Tasteprint',
        catalogTitle: formValue('catalogTitle') || `${formValue('name')} picks for this Tasteprint`,
        catalogSubtitle: formValue('catalogSubtitle') || 'Recommendations matched to how this result actually behaves.'
      },
      scoring: {
        dimensionMultipliers: {}
      },
      catalog: structuredClone(catalog)
    };
  }

  function errorsMarkup(errors) {
    if (!errors.length) return '<div class="admin-good">Looks valid.</div>';
    return `<div class="admin-errors"><strong>Fix ${errors.length} thing${errors.length === 1 ? '' : 's'}:</strong><ul>${errors.map((error) => `<li>${esc(error)}</li>`).join('')}</ul></div>`;
  }

  function catalogMarkup() {
    if (!catalog.length) return '<p class="small">No catalog loaded yet. Import CSV or JSON, or paste it into the editor.</p>';
    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Offer</th><th>Modes</th><th>Archetypes</th><th>CTA</th></tr></thead>
          <tbody>${catalog.map((item) => `
            <tr>
              <td><strong>${esc(item.name)}</strong><div class="small">${esc(item.id)} · ${esc(item.tag || '')}</div></td>
              <td>${esc((item.modes || []).join(', '))}</td>
              <td>${esc((item.archetypes || []).join(', '))}</td>
              <td>${item.href ? `<span class="admin-link-ok">HTTPS</span>` : '<span class="small">Demo/no link</span>'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  function renderDraftList() {
    const target = app.querySelector('#saved-drafts');
    if (!target) return;
    const campaigns = listCampaigns().filter((campaign) => !campaign.published || campaign.localDraft || campaign.id === 'aster');
    target.innerHTML = campaigns.map((campaign) => `
      <div class="admin-draft-row">
        <div><strong>${esc(campaign.name)}</strong><div class="small">${esc(campaign.id)}${campaign.localDraft ? ' · local draft' : ' · source-controlled demo'}</div></div>
        <div class="row">
          <a class="secondary" href="?campaign=${encodeURIComponent(campaign.id)}">Preview</a>
          ${campaign.localDraft ? `<button class="secondary" data-load-draft="${esc(campaign.id)}">Edit</button><button class="danger" data-delete-draft="${esc(campaign.id)}">Delete</button>` : ''}
        </div>
      </div>`).join('') || '<p class="small">No campaigns found.</p>';
  }

  function renderPublishedList() {
    const target = app.querySelector('#published-campaigns');
    if (!target) return;
    if (!REMOTE_CAMPAIGNS_ENABLED) {
      target.innerHTML = '<p class="small">Production registry is inactive until Supabase is connected.</p>';
      return;
    }
    if (!publishedCampaigns.length) {
      target.innerHTML = '<p class="small">No published campaigns were returned by the registry.</p>';
      return;
    }
    target.innerHTML = publishedCampaigns.map((campaign) => `
      <div class="admin-draft-row">
        <div><strong>${esc(campaign.name || campaign.id)}</strong><div class="small">${esc(campaign.id)} · published v${esc(campaign.version || '?')}</div></div>
        <div class="row"><a class="secondary" href="?campaign=${encodeURIComponent(campaign.id)}&published=1">Open published</a></div>
      </div>`).join('');
  }

  async function loadPublishedLibrary() {
    if (!REMOTE_CAMPAIGNS_ENABLED) return renderPublishedList();
    publishedCampaigns = await listPublishedCampaigns();
    renderPublishedList();
  }

  function setStatus(message, kind = '') {
    const status = app.querySelector('#admin-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setPublishStatus(message, kind = '') {
    const status = app.querySelector('#publish-status');
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function populate(campaign) {
    if (!campaign) return;
    const fields = {
      id: campaign.id,
      name: campaign.name,
      label: campaign.label,
      description: campaign.description,
      accent: campaign.theme?.accent,
      title: campaign.copy?.title,
      lede: campaign.copy?.lede,
      start: campaign.copy?.start,
      resultEyebrow: campaign.copy?.resultEyebrow,
      catalogTitle: campaign.copy?.catalogTitle,
      catalogSubtitle: campaign.copy?.catalogSubtitle
    };
    Object.entries(fields).forEach(([name, value]) => {
      const input = app.querySelector(`[name="${name}"]`);
      if (input && value != null) input.value = value;
    });
    catalog = structuredClone(campaign.catalog || []);
    const editor = app.querySelector('#catalog-editor');
    if (editor) editor.value = JSON.stringify(catalog, null, 2);
    refreshCatalog();
  }

  function refreshCatalog() {
    const validation = app.querySelector('#catalog-validation');
    const preview = app.querySelector('#catalog-preview');
    const errors = validateCatalog(catalog);
    if (validation) validation.innerHTML = errorsMarkup(errors);
    if (preview) preview.innerHTML = catalogMarkup();
  }

  function parseEditor() {
    const editor = app.querySelector('#catalog-editor');
    try {
      catalog = parseCatalogText(editor?.value || '', lastFilename);
      refreshCatalog();
      setStatus(`Loaded ${catalog.length} catalog item${catalog.length === 1 ? '' : 's'}.`, 'good');
    } catch (error) {
      setStatus(error?.message || 'Could not parse catalog.', 'bad');
    }
  }

  function validateCurrentManifest() {
    const manifest = currentManifest();
    const errors = [...validateCatalog(manifest.catalog), ...validateCampaignManifest(manifest)];
    return { manifest, errors };
  }

  function render() {
    document.title = 'Tasteprint Campaign Studio';
    app.innerHTML = `
      <section class="panel pad campaign-admin">
        <div class="row spread admin-header">
          <div>
            <div class="eyebrow">Tasteprint Campaign Studio</div>
            <h1>Build a branded campaign without touching source code.</h1>
            <p class="lede">Create the campaign shell, import a client catalog from CSV or JSON, validate it, save a browser-local draft, and launch the real Tasteprint flow with that configuration.</p>
          </div>
          <a class="secondary" href="?">Exit studio</a>
        </div>

        <div class="admin-grid">
          <div class="admin-stack">
            <div class="card admin-section">
              <div class="eyebrow">1 · Campaign identity</div>
              <div class="admin-fields two-col">
                <label>Campaign ID<input name="id" placeholder="hotel-summer-2026" /></label>
                <label>Client / campaign name<input name="name" placeholder="Aster & Tide" /></label>
                <label>Display label<input name="label" placeholder="Aster & Tide × Tasteprint" /></label>
                <label>Accent color<input name="accent" type="color" value="#5b8cff" /></label>
              </div>
              <label>Description<textarea name="description" rows="2" placeholder="Internal/portfolio description"></textarea></label>
            </div>

            <div class="card admin-section">
              <div class="eyebrow">2 · Consumer copy</div>
              <label>Landing title<input name="title" placeholder="Find the escape you’d actually book." /></label>
              <label>Landing description<textarea name="lede" rows="3" placeholder="Make a few instinctive tradeoffs..."></textarea></label>
              <div class="admin-fields two-col">
                <label>Start button<input name="start" value="Find my match" /></label>
                <label>Result eyebrow<input name="resultEyebrow" value="Your matched Tasteprint" /></label>
              </div>
              <label>Catalog heading<input name="catalogTitle" placeholder="Our picks for this Tasteprint" /></label>
              <label>Catalog subheading<textarea name="catalogSubtitle" rows="2" placeholder="Recommendations matched to this result."></textarea></label>
            </div>
          </div>

          <div class="admin-stack">
            <div class="card admin-section">
              <div class="row spread">
                <div><div class="eyebrow">3 · Client catalog</div><h3>CSV or JSON import</h3></div>
                <button class="secondary" id="download-template">CSV template</button>
              </div>
              <p class="small">Required per item: id, name, description, and at least one travel mode. In CSV, separate multiple modes/archetypes with a vertical bar: <code>Coastal Romantic|City + Coast</code>.</p>
              <div class="row admin-import-row">
                <label class="secondary file-button">Choose CSV/JSON<input id="catalog-file" type="file" accept=".csv,.json,text/csv,application/json" /></label>
                <button class="secondary" id="load-aster">Load Aster example</button>
              </div>
              <textarea id="catalog-editor" class="admin-code" rows="12" spellcheck="false" placeholder="Paste a CSV or JSON catalog here..."></textarea>
              <div class="row"><button class="primary" id="parse-catalog">Validate & preview catalog</button><button class="secondary" id="export-catalog">Export catalog CSV</button></div>
              <div id="catalog-validation" style="margin-top:12px"></div>
            </div>
          </div>
        </div>

        <div class="card admin-section" style="margin-top:20px">
          <div class="row spread"><div><div class="eyebrow">Catalog preview</div><h3>${catalog.length ? `${catalog.length} imported offers` : 'Waiting for a catalog'}</h3></div><span class="badge">Source-free import MVP</span></div>
          <div id="catalog-preview">${catalogMarkup()}</div>
        </div>

        <div class="callout admin-launch" style="margin-top:20px">
          <div>
            <div class="eyebrow">4 · Save and launch</div>
            <h2>Turn this into a working Tasteprint campaign.</h2>
            <p class="small">Drafts stay in this browser. Export the manifest when you want a portable copy or save it before publishing.</p>
          </div>
          <div class="row admin-actions">
            <button class="primary" id="save-preview">Save draft & preview</button>
            <button class="secondary" id="download-manifest">Download manifest JSON</button>
          </div>
          <p id="admin-status" class="small" role="status" aria-live="polite"></p>
        </div>

        <div class="card admin-section" style="margin-top:20px">
          <div class="eyebrow">5 · Production publish</div>
          <h2>Promote a validated campaign to the public registry.</h2>
          <p class="small">${REMOTE_CAMPAIGNS_ENABLED ? 'Backend detected. Publishing requires the private operator token configured only in the Supabase Edge Function. The token you enter here is used for this request and is not saved by Tasteprint.' : 'Publishing is disabled in this build because Supabase has not been connected yet. The registry and secure publish function are already scaffolded.'}</p>
          <div class="admin-fields two-col">
            <label>Operator publish token<input id="publish-token" type="password" autocomplete="off" placeholder="Not stored" ${REMOTE_CAMPAIGNS_ENABLED ? '' : 'disabled'} /></label>
            <div class="row admin-actions" style="align-items:end">
              <button class="primary" id="publish-campaign" ${REMOTE_CAMPAIGNS_ENABLED ? '' : 'disabled'}>Publish campaign</button>
              <button class="danger" id="unpublish-campaign" ${REMOTE_CAMPAIGNS_ENABLED ? '' : 'disabled'}>Unpublish</button>
            </div>
          </div>
          <div class="row" style="margin-top:12px"><a id="open-published" class="secondary" href="#" hidden>Open published campaign</a></div>
          <p id="publish-status" class="small" role="status" aria-live="polite"></p>
        </div>

        <div class="admin-grid" style="margin-top:20px">
          <div class="card admin-section">
            <div class="eyebrow">Local campaign library</div>
            <h3>Drafts and source demos</h3>
            <div id="saved-drafts"></div>
          </div>
          <div class="card admin-section">
            <div class="eyebrow">Published campaign registry</div>
            <h3>Public campaigns</h3>
            <div id="published-campaigns"><p class="small">Loading registry…</p></div>
          </div>
        </div>
      </section>`;

    renderDraftList();
    refreshCatalog();
    loadPublishedLibrary();

    app.querySelector('#catalog-file')?.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      lastFilename = file.name;
      const text = await file.text();
      const editor = app.querySelector('#catalog-editor');
      if (editor) editor.value = text;
      parseEditor();
    });

    app.querySelector('#parse-catalog')?.addEventListener('click', parseEditor);
    app.querySelector('#download-template')?.addEventListener('click', () => download('tasteprint-catalog-template.csv', catalogTemplateCSV(), 'text/csv'));
    app.querySelector('#export-catalog')?.addEventListener('click', () => {
      if (!catalog.length) return setStatus('Load a catalog before exporting it.', 'bad');
      download('tasteprint-catalog.csv', catalogToCSV(catalog), 'text/csv');
    });
    app.querySelector('#load-aster')?.addEventListener('click', () => populate(getCampaign('aster')));

    app.querySelector('#download-manifest')?.addEventListener('click', () => {
      const { manifest, errors } = validateCurrentManifest();
      if (errors.length) {
        setStatus(`Manifest is not ready: ${errors[0]}`, 'bad');
        return;
      }
      download(`${manifest.id || 'tasteprint-campaign'}.json`, JSON.stringify(manifest, null, 2));
      setStatus('Campaign manifest downloaded.', 'good');
    });

    app.querySelector('#save-preview')?.addEventListener('click', () => {
      const { manifest, errors } = validateCurrentManifest();
      if (errors.length) return setStatus(errors[0], 'bad');
      const saved = saveCampaignDraft(manifest);
      if (!saved.ok) return setStatus(saved.errors[0], 'bad');
      setStatus('Draft saved. Opening the live campaign preview…', 'good');
      setTimeout(() => { location.href = `?campaign=${encodeURIComponent(saved.campaign.id)}`; }, 250);
    });

    app.querySelector('#publish-campaign')?.addEventListener('click', async () => {
      const { manifest, errors } = validateCurrentManifest();
      if (errors.length) return setPublishStatus(errors[0], 'bad');
      const token = app.querySelector('#publish-token')?.value || '';
      setPublishStatus('Publishing validated campaign…');
      const result = await publishCampaign(manifest, token);
      if (!result.ok) return setPublishStatus(result.error || 'Publish failed.', 'bad');
      await refreshPublishedCampaign(manifest.id);
      await loadPublishedLibrary();
      const link = app.querySelector('#open-published');
      if (link) {
        link.href = `?campaign=${encodeURIComponent(manifest.id)}&published=1`;
        link.hidden = false;
      }
      setPublishStatus(`Published ${manifest.id} as version ${result.version}.`, 'good');
    });

    app.querySelector('#unpublish-campaign')?.addEventListener('click', async () => {
      const id = safeId(formValue('id'));
      if (!id) return setPublishStatus('Campaign id is required before unpublishing.', 'bad');
      const token = app.querySelector('#publish-token')?.value || '';
      setPublishStatus(`Unpublishing ${id}…`);
      const result = await unpublishCampaign(id, token);
      if (!result.ok) return setPublishStatus(result.error || 'Unpublish failed.', 'bad');
      await refreshPublishedCampaign(id);
      await loadPublishedLibrary();
      const link = app.querySelector('#open-published');
      if (link) link.hidden = true;
      setPublishStatus(`${id} is no longer public.`, 'good');
    });

    app.addEventListener('click', (event) => {
      const load = event.target.closest('[data-load-draft]')?.dataset.loadDraft;
      if (load) populate(getCampaign(load));
      const remove = event.target.closest('[data-delete-draft]')?.dataset.deleteDraft;
      if (remove && deleteCampaignDraft(remove)) {
        setStatus(`Deleted local draft ${remove}.`, 'good');
        renderDraftList();
      }
    });

    const edit = params.get('edit');
    if (edit) populate(getCampaign(edit));
  }

  render();
}
